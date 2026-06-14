import type { AVCFrame } from '@cbingbing/demuxer'
import type { AvcFrameData } from './demuxerTsNew'
import type { ChunkReader } from './io/ChunkIO'
import type { FetchIO } from './io/FetchIO'
import type { Logger } from '@/utils/logger'
import { promise } from '@115master/utils'
import { appLogger } from '@/utils/logger'
import { DecoderFlowError } from './DecoderFlowError'
import { DemuxerTsNew } from './demuxerTsNew'
import { microsecTimebase, secTimebase, timebaseConvert } from './timebase'

/**
 * M3U8 视频剪辑器跳转结果
 */
export interface FrameData {
  /** 视频帧 */
  videoFrame: VideoFrame
  /** 帧实际时间(秒) */
  frameTime: number
  /** 请求时间(秒) */
  seekTime: number
  /** 消耗时间(毫秒) */
  consumedTime: number
}

export interface SampleQueueItem extends AvcFrameData {
  encodedChunk: EncodedVideoChunk
}

export interface DecoderFlowOptions {
  /** 目标时间/秒 */
  targetTime: number
  /** 基础时间/秒，它用于校准视频帧时间 */
  baseTime: number
  /** 分片 URL */
  segmentUrl: string
  /** 首帧优先 */
  firstFramePriority: boolean
  /** 输入输出流 */
  io: FetchIO
  /** 日志 */
  logger?: Logger
}
/**
 * 解码器流
 * @description 负责管理 VideoDecoder、Demuxer 和解码循环逻辑
 */
export class DecoderFlow {
  static readonly LOGGER_NAME = 'DecoderFlow'
  protected logger = appLogger.sub(DecoderFlow.LOGGER_NAME)
  private videoDecoder: VideoDecoder | undefined
  private demuxer: DemuxerTsNew | undefined
  private sampleQueue: SampleQueueItem[] = []
  private samplesProcessed: SampleQueueItem[] = []
  private decodedFramesTimes: number[] = []
  private frame: VideoFrame | undefined
  private isRunning: boolean = true
  private targetTime: number
  private baseTime: number
  private segmentUrl: string = ''
  private firstFramePriority: boolean
  private io: FetchIO
  private firstPts: number | undefined
  private reader: ChunkReader | undefined
  private error: Error | undefined
  constructor(
    options: DecoderFlowOptions,
  ) {
    if (options.logger) {
      this.logger = options.logger.sub(DecoderFlow.LOGGER_NAME)
    }
    this.targetTime = options.targetTime
    this.baseTime = options.baseTime
    this.segmentUrl = options.segmentUrl
    this.firstFramePriority = options.firstFramePriority
    this.io = options.io
  }

  /**
   * 初始化解码器和解复用器
   */
  initialize(): void {
    this.logger.debug(`initialize 开始, segmentUrl: ${this.segmentUrl}`)
    this.videoDecoder = this._createDecoder()
    this.demuxer = this._createDemuxer()
    this.reader = this.io.createChunkReader(this.segmentUrl, 0)
    this.logger.debug(`initialize 完成, videoDecoder状态: ${this.videoDecoder.state}`)
  }

  /**
   * 推送数据到解复用器
   * @param buffer 数据缓冲区
   * @param done 是否完成
   */
  pushData(buffer: ArrayBuffer, done?: boolean): void {
    if (!this.demuxer) {
      this.logger.warn('pushData demuxer is undefined')
      return
    }

    if (done) {
      this.logger.debug(`pushData 推送最后一块数据, 大小: ${buffer.byteLength} bytes`)
    }
    else {
      // 只在解码器未配置时记录，帮助调试
      if (this.videoDecoder?.state === 'unconfigured') {
        this.logger.debug(`pushData 推送数据到解复用器, 大小: ${buffer.byteLength} bytes, 解码器状态: ${this.videoDecoder.state}`)
      }
    }
    this.demuxer.push(buffer, done ? { done: true } : undefined)
  }

  /**
   * 检查是否已找到帧
   * @returns 是否已找到帧
   */
  hasFrame(): boolean {
    return !!this.frame
  }

  /**
   * 等待帧解码完成
   * @param timeoutMs 超时时间（毫秒）
   * @returns 解码结果
   */
  async waitForFrame(timeoutMs: number): Promise<FrameData | undefined> {
    if (!this.videoDecoder || !this.demuxer) {
      const component = !this.videoDecoder ? 'videoDecoder' : 'demuxer'
      throw new DecoderFlowError.NotInitialized(component)
    }
    const startTime = Date.now()
    this.logger.debug(`waitForFrame 开始, targetTime: ${this.targetTime}, timeoutMs: ${timeoutMs}, segmentUrl: ${this.segmentUrl}`)

    await this.autoReadChunk()

    this.videoDecoder.ondequeue = () => {
      this.autoReadChunk()
    }

    let loopCount = 0
    let lastAutoReadTime = Date.now()
    while (this.isRunning) {
      loopCount++
      const elapsed = Date.now() - startTime
      const timeout = this._checkTimeout(startTime, timeoutMs)

      // 如果解码器未配置，主动尝试读取数据（每100ms尝试一次）
      if (this.videoDecoder?.state === 'unconfigured' && Date.now() - lastAutoReadTime > 100) {
        this.logger.debug(`解码器未配置，主动尝试读取数据`)
        await this.autoReadChunk()
        lastAutoReadTime = Date.now()
      }

      if (this.error) {
        this._stop()
        throw this.error
      }

      if (this._shouldStop() || timeout) {
        if (timeout) {
          this.logger.error(`超时! 循环次数: ${loopCount}, 已耗时: ${elapsed}ms`)
          this.logger.error(`超时时的状态:`, {
            targetTime: this.targetTime,
            segmentUrl: this.segmentUrl,
            videoDecoderState: this.videoDecoder?.state,
            decodeQueueSize: this.videoDecoder?.decodeQueueSize,
            sampleQueueLength: this.sampleQueue.length,
            samplesProcessedLength: this.samplesProcessed.length,
            hasFrame: !!this.frame,
            readerIsDoned: this.reader?.isDoned,
            isRunning: this.isRunning,
            firstPts: this.firstPts,
          })
          this._stop()

          throw new DecoderFlowError.Timeout(
            this.targetTime,
            this.segmentUrl,
            timeoutMs,
          )
        }

        this._stop()

        if (this.frame) {
          const frameTime = this._getFrameRealTime(this.frame.timestamp)
          this.logger.debug(`成功找到帧, frameTime: ${frameTime}, 耗时: ${Date.now() - startTime}ms`)
          return {
            videoFrame: this.frame.clone(),
            frameTime,
            seekTime: this.targetTime,
            consumedTime: Date.now() - startTime,
          }
        }
      }

      await this._processSampleQueue()
    }

    return undefined
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this._stop()
    this.sampleQueue = []
    this.samplesProcessed = []

    if (this.frame) {
      this.frame.close()
      this.frame = undefined
    }

    if (this.demuxer) {
      this.demuxer.destroy()
      this.demuxer = undefined
    }

    if (this.videoDecoder && this.videoDecoder.state !== 'closed') {
      this.videoDecoder.close()
      this.videoDecoder = undefined
    }
  }

  /**
   * 销毁所有资源
   */
  destroy(): void {
    this.cleanup()
  }

  /**
   * 创建视频解码器
   * @returns 视频解码器
   */
  private _createDecoder(): VideoDecoder {
    const videoDecoder = new VideoDecoder({
      output: (videoFrame) => {
        this._processFrame(videoFrame)
      },
      error: (error) => {
        this.error = new DecoderFlowError.DecoderRuntime(error)
        this._stop()
      },
    })
    return videoDecoder
  }

  /**
   * 创建解复用器
   * @returns 解复用器
   */
  private _createDemuxer(): DemuxerTsNew {
    this.logger.debug('创建解复用器')
    return new DemuxerTsNew({
      onConfig: (config) => {
        this._configure(config.codec)
      },
      onAvcFrameData: (encodeChunk) => {
        this._onAvcFrameData(encodeChunk)
      },
      onDone: () => {
        this.logger.debug('解复用完成, 刷新解码器')
        if (this.videoDecoder) {
          this.videoDecoder.flush()
        }
      },
    })
  }

  /**
   * 配置解码器
   * @param codec 编解码器字符串
   */
  private _configure(codec: string): void {
    if (!this.videoDecoder) {
      this.logger.warn('videoDecoder is undefined')
      return
    }

    try {
      this.logger.debug(`配置解码器, codec: ${codec}`)
      this.videoDecoder.configure({
        codec,
      })
      this.logger.debug(`解码器配置成功, 状态: ${this.videoDecoder.state}`)
    }
    catch (error) {
      this.error = new DecoderFlowError.DecoderConfiguration(codec, error)
    }
  }

  /**
   * 处理解复用后的 chunk
   */
  private _onAvcFrameData(encodeChunk: {
    avcFrame: AVCFrame
    rawData: Uint8Array
  }): void {
    const { avcFrame, rawData } = encodeChunk

    if (this._shouldStop()) {
      return
    }

    if (!avcFrame.pts) {
      this.logger.warn('_onDecodeChunk avcFrame lost pts')
      return
    }

    if (!avcFrame.duration) {
      this.logger.warn('_onDecodeChunk avcFrame lost duration')
      return
    }

    if (this.videoDecoder?.state === 'unconfigured') {
      this.logger.warn('_onDecodeChunk videoDecoder is unconfigured')
      return
    }

    if (!this.firstPts) {
      this.firstPts = avcFrame.pts
      if (!avcFrame.keyframe) {
        this.logger.warn('_onDecodeChunk first avcFrame is not keyframe')
      }
    }

    const encodedChunk = new EncodedVideoChunk({
      type: avcFrame.keyframe ? 'key' : 'delta',
      timestamp: timebaseConvert((avcFrame.pts), secTimebase, microsecTimebase),
      data: rawData,
    })

    this.sampleQueue.push(
      {
        encodedChunk,
        avcFrame,
        rawData,
      },
    )
  }

  /**
   * 处理解码出的帧
   * @param videoFrame 视频帧
   */
  private _processFrame(videoFrame: VideoFrame): void {
    this.decodedFramesTimes.push(this._getFrameRealTime(videoFrame.timestamp))
    const matchedFrame = this.matchFrame(videoFrame)

    if (!this.frame && matchedFrame) {
      this.frame = matchedFrame
      return
    }

    videoFrame.close()
  }

  /**
   * 匹配第一个输出帧
   * @param videoFrame 视频帧
   * @returns 视频帧
   */
  private matchFirstFrameOutput(videoFrame: VideoFrame): VideoFrame | undefined {
    if (this.firstFramePriority && !this.frame) {
      return videoFrame
    }
    return undefined
  }

  /**
   * 匹配帧时间范围
   * @param frameTime 帧时间/秒
   * @returns 是否匹配
   */
  private matchFrameTimeRange(frameTime: number): boolean {
    return Math.ceil(frameTime) >= this.targetTime
  }

  /**
   * 精确匹配输出帧
   * @param videoFrame 视频帧
   * @returns 视频帧
   */
  private matchAccurateOutput(videoFrame: VideoFrame): VideoFrame | undefined {
    const frameTime = this._getFrameRealTime(videoFrame.timestamp)
    const isMatch = this.matchFrameTimeRange(frameTime)
    if (isMatch) {
      return videoFrame
    }
    return undefined
  }

  /**
   * 匹配帧时间
   * @param videoFrame 视频帧
   * @returns 是否匹配
   */
  private matchFrame(videoFrame: VideoFrame): VideoFrame | undefined {
    return this.matchFirstFrameOutput(videoFrame)
      || this.matchAccurateOutput(videoFrame)
  }

  /**
   * 自动读取分块
   */
  private async autoReadChunk() {
    const decodeQueueSize = this.videoDecoder?.decodeQueueSize ?? 0
    const shouldRead = (
      decodeQueueSize === 0
      && !this.frame
      && this.isRunning
      && this.reader
      && !this.reader.isDoned
    )

    if (shouldRead && this.reader) {
      try {
        this.logger.debug(`autoReadChunk 开始读取, decodeQueueSize: ${decodeQueueSize}`)
        const arrayBuffer = await this.reader.next()
        if (arrayBuffer) {
          this.logger.debug(`autoReadChunk 读取成功, 数据大小: ${arrayBuffer.byteLength} bytes`)
          this.pushData(arrayBuffer)
        }
        else {
          this.logger.warn(`autoReadChunk 读取返回 undefined, reader.isDoned: ${this.reader.isDoned}`)
        }
      }
      catch (error) {
        this.error = new DecoderFlowError.DataRead(
          this.segmentUrl,
          error,
        )
        throw this.error
      }
    }
  }

  /**
   * 检查是否超时
   * @param startTime 开始时间
   * @param timeoutMs 超时时间（毫秒）
   * @returns 是否超时
   */
  private _checkTimeout(startTime: number, timeoutMs: number): boolean {
    return Date.now() - startTime > timeoutMs
  }

  /**
   * 判断是否应该停止
   * @returns 是否停止
   */
  private _shouldStop(): boolean {
    return !!this.frame || !this.isRunning
  }

  /**
   * 停止解码
   */
  private _stop(): void {
    this.isRunning = false
  }

  /**
   * 处理样本队列
   * @returns Promise<void>
   */
  private async _processSampleQueue(): Promise<void> {
    if (this.sampleQueue.length === 0) {
      await promise.promiseDelay(0)
      return
    }

    const sample = this.sampleQueue.shift()
    if (sample && this.videoDecoder) {
      try {
        this.samplesProcessed.push(sample)
        this.videoDecoder.decode(sample.encodedChunk)
      }
      catch (error) {
        const decodeError = new DecoderFlowError.DecodeFailed(
          sample.avcFrame.pts,
          sample.avcFrame.keyframe,
          sample.encodedChunk.timestamp,
          this.videoDecoder?.state,
          error,
        )
        this.logger.error('解码失败:', decodeError, {
          sample: {
            pts: sample.avcFrame.pts,
            keyframe: sample.avcFrame.keyframe,
            timestamp: sample.encodedChunk.timestamp,
          },
          decoderState: this.videoDecoder?.state,
        })
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
    return (this.baseTime ?? 0) + (videoFrameTime - (this.firstPts ?? 0))
  }
}
