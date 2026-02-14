/** 播放中的视频信息 */
export interface PlayingVideoInfo {
  /** 文件唯一标识 */
  pickCode: string
}

/** m3u8 视频信息 */
export interface M3u8Item {
  /** 名称 */
  name: string
  /** 地址 */
  url: string
  /** 质量 */
  quality: number
}
