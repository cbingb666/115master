import { promiseDelay } from '../promise'
import { DemuxerTsNew } from './demuxerTsNew'
import { FetchIO } from './io/FetchIO'
import { HlsIO } from './io/HlsIO'
import { microsecTimebase, secTimebase, timebaseConvert } from './timebase'

/** 超时时间 */
const TIMEOUT_MS = 5000

/**
 * M3U8 视频剪辑器构造选项
 */
interface M3U8ClipperOptions {
  /** m3u8 url */
  url: string
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求选项 */
  fetchOptions?: RequestInit
}

/**
 * M3U8 视频剪辑器跳转结果
 */
interface M3u8ClipperSeekResult {
  /** 视频帧 */
  videoFrame: VideoFrame
  /** 帧实际时间(秒) */
  frameTime: number
  /** 请求时间(秒) */
  seekTime: number
  /** 消耗时间(毫秒) */
  consumedTime: number
}

/**
 * M3U8 视频剪辑器
 */
export class M3U8ClipperNew {
  hlsIo: HlsIO
  constructor(private options: M3U8ClipperOptions) {
    this.hlsIo = new HlsIO()
  }

  /**
   * 销毁
   */
  destroy() {
    this.hlsIo.destroy()
  }

  /**
   * 打开
   * @description 打开 m3u8 文件
   */
  async open(): Promise<void> {
    await this.hlsIo.open(this.options)
  }

  /**
   * 跳转
   * @description 跳转到分片截取 VideoFrame
   * @param time 时间
   * @param stream 是否只处理关键帧
   * @returns 视频帧
   */
  async seek(
    time: number,
    stream = false,
  ): Promise<M3u8ClipperSeekResult | undefined> {
    /** 当前时间 */
    const now = Date.now()
    /** 视频帧 */
    let frame: VideoFrame | undefined
    /** 是否循环 */
    let loop = true
    /** 跳转 */
    const segment = await this.hlsIo.seek(time)
    /** 流式读取 */
    const io = new FetchIO()
    const sampleQueue: EncodedVideoChunk[] = []

    /** 解码器 */
    const videoDecoder = new VideoDecoder({
      output: (videoFrame) => {
        const frameTime = this._getFrameRealTime(videoFrame.timestamp)
        if (stream && !frame) {
          frame = videoFrame
          return
        }

        if (frameTime >= time && !frame) {
          frame = videoFrame
          return
        }
        videoFrame.close()
      },
      error: (error) => {
        console.error(error.message)
        console.error('解码器错误', this.hlsIo.segmentUrl)
        // eslint-disable-next-line ts/no-use-before-define
        destroy()
      },
    })

    /** 解复用器 */
    const demuxer = new DemuxerTsNew({
      onConfig: (config) => {
        videoDecoder.configure({
          codec: config.codec,
        })
      },
      onDecodeChunk: (encodeChunk) => {
        const chunk = new EncodedVideoChunk({
          type: encodeChunk.avcFrame.keyframe ? 'key' : 'delta',
          timestamp: encodeChunk.avcFrame.pts! * 1_000_000,
          duration: encodeChunk.avcFrame.duration! * 1_000_000,
          data: encodeChunk.rawData,
        })
        sampleQueue.push(chunk)
      },
      onDone: () => {
        videoDecoder.flush()
      },
    })

    /** 销毁 */
    const destroy = () => {
      loop = false
      demuxer.destroy()
      videoDecoder.state !== 'closed' && videoDecoder.close()
    }

    if (stream) {
      io.streamChunks(segment.url, async (buffer) => {
        if (demuxer.demux) {
          demuxer.push(new Uint8Array(buffer))
        }
        else {
          return false
        }
        await promiseDelay(100)
        if (frame) {
          // 如果已经找到关键帧，则停止读取
          return false
        }
        console.count('继续读取')
        // 如果未找到关键帧，则继续读取
        return true
      })
    }
    else {
      const response = await io.fetchBufferRange(segment.url, 0, -1)
      const buffer = await response.arrayBuffer()
      demuxer.push(buffer, {
        done: true,
      })
    }

    while (loop) {
      // 如果已经找到关键帧，则停止读取
      if (frame) {
        loop = false
        destroy()
        return {
          videoFrame: frame,
          frameTime: this._getFrameRealTime(frame.timestamp),
          seekTime: time,
          consumedTime: Date.now() - now,
        }
      }
      // 如果超过超时时间，则销毁
      if (Date.now() - now > TIMEOUT_MS) {
        console.error(`m3u8Clipper seek timeout, time: ${time}`)
        loop = false
        destroy()
        return undefined
      }

      // 如果存在样本队列，则解码
      if (sampleQueue.length > 0) {
        const chunk = sampleQueue.shift()
        if (chunk) {
          videoDecoder.decode(chunk)
          await videoDecoder.flush()
        }
      }
      else {
        await promiseDelay(0)
      }
    }
  }

  /**
   * 获取帧的实际时间
   * @param timestamp 时间戳 (微秒) 来源与 VideoFrame 或 EncodedVideoChunk
   * @returns 实际时间 (秒)
   */
  private _getFrameRealTime(timestamp: number): number {
    /** 转换时间基 */
    const videoFrameTime = timebaseConvert(
      timestamp,
      microsecTimebase,
      secTimebase,
    )
    /** 转换时间基 */
    const frameTime = videoFrameTime
    return frameTime
  }
}
