import type { Segment as M3U8Segment } from 'm3u8-parser'
import type { Range } from './IO'
import { Parser } from 'm3u8-parser'

/**
 * 请求信息
 */
interface FetchInfo {
  /** 请求 URL */
  url: string
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求选项 */
  fetchOptions?: RequestInit
}

/**
 * 分段
 */
export type Segment = M3U8Segment & {
  /** 分段 URL */
  url: string
  /** 分段时间戳 */
  timestamp: number
}

/**
 * HlsIO 类 - 负责从URL获取指定范围的视频数据
 * 处理数据块的读取和管理
 */
export class HlsIO {
  /** 请求信息 */
  info: FetchInfo | undefined

  /** 当前分片索引 */
  segmentIndex = 0

  /** 分片列表 */
  segments: Segment[] = []

  /** 总时长 */
  duration = 0

  /** 当前分片 */
  get segment() {
    return this.segments[this.segmentIndex]
  }

  /** 当前分片URL */
  get segmentUrl() {
    if (!this.info) {
      throw new Error('info is undefined')
    }
    return new URL(this.segment.uri, this.info.url).href
  }

  /**
   * 打开
   * @param info 请求信息
   */
  async open(info: FetchInfo): Promise<void> {
    this.info = info
    await this.fetchMasterPlaylist()
  }

  /**
   * 读取
   * @param range 范围
   * @returns 获取到的ArrayBuffer
   */
  async read(range: Range): Promise<ArrayBuffer> {
    const response = await fetch(this.segments[this.segmentIndex].uri, {
      headers: {
        Range: `bytes=${range.start}-${range.end}`,
      },
      ...(this.info?.fetchOptions ?? {}),
    })
    return await response.arrayBuffer()
  }

  /**
   * 跳转
   * @param time 时间
   * @returns 跳转到的分片
   */
  async seek(time: number): Promise<Segment> {
    this.segmentIndex = this.segments.findIndex(
      i => i.timestamp <= time && time <= i.timestamp + i.duration,
    )
    if (this.segmentIndex === -1) {
      throw new Error('时间超出范围')
    }
    return this.segment
  }

  /**
   * 销毁
   */
  destroy() {
    this.segments = []
    this.segmentIndex = 0
    this.duration = 0
    this.info = undefined
  }

  /**
   * 获取主播放列表
   */
  private async fetchMasterPlaylist(): Promise<void> {
    if (!this.info) {
      throw new Error('info is undefined')
    }
    const response = await fetch(this.info.url, {
      headers: this.info.headers,
    })
    const m3u8Text = await response.text()
    const parser = new Parser({
      url: this.info.url,
    })
    parser.push(m3u8Text)
    parser.end()
    let start = 0
    this.segments = parser.manifest.segments.map((segment) => {
      const timestamp = start
      start += segment.duration
      return {
        ...segment,
        duration: segment.duration,
        timestamp,
        url: new URL(segment.uri, this.info?.url).href,
      }
    })
    this.duration = start
  }
}
