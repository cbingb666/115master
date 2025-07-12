/**
 * 播放器核心类型
 */
export enum PlayerCoreType {
  // 原生
  Native = 'Native',
  // AvPlayer
  AvPlayer = 'AvPlayer',
  // hls.js
  Hls = 'HLS.js',
}

/**
 * 播放器核心事件
 */
export interface PlayerCoreEvents {
  /** 可以播放 */
  canplay: () => void
  /** 时间更新 */
  timeupdate: (time: number) => void
  /** 正在跳转 */
  seeking: () => void
  /** 跳转完成 */
  seeked: () => void
}

/**
 * 播放器核心方法
 */
export interface PlayerCoreMethods {
  /** 初始化 */
  init: (container: HTMLDivElement) => Promise<void>
  /** 加载 */
  load: (
  // 视频源
    url: string,
  // 上次播放时间
    lastTime?: number,
  ) => Promise<void>
  /** 播放 */
  play: () => Promise<void>
  /** 暂停 */
  pause: () => Promise<void>
  /** 切换播放 */
  togglePlay: () => Promise<void>
  /** 播放器速率 (0.1-15) */
  setPlaybackRate: (rate: number) => void
  /** 播放器音量 (0-100) */
  setVolume: (volume: number) => void
  /** 设置静音 */
  setMute: (muted: boolean) => void
  /** 切换静音 */
  toggleMute: () => void
  /**
   * 恢复音频或播放
   * @description 由于音频被浏览器限制而挂起时，可以在触发点击事件时恢复音频或播放
   * 1. 如果是 Native 和 Hls 播放器，则恢复播放
   * 2. 如果是 AvPlayer 播放器，则恢复音频
   */
  resumeSuspended: () => Promise<void>
  /** 设置自动播放 */
  setAutoPlay: (autoPlay: boolean) => void
  /** 跳转 (秒) */
  seek: (time: number) => Promise<void>
  /** 获取渲染元素 */
  getRenderElement: () => HTMLVideoElement | HTMLCanvasElement | null
  /** 销毁 */
  destroy: () => Promise<void>
  /** 事件监听 */
  on: (
    name: keyof PlayerCoreEvents,
    callback: PlayerCoreEvents[keyof PlayerCoreEvents],
  ) => void
}
