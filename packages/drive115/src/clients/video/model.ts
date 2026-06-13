/** m3u8 视频信息 */
export interface M3u8Item {
  /** 名称 */
  name: string
  /** 地址 */
  url: string
  /** 质量 */
  quality: number
}

/** 下载结果 */
export interface DownloadResult {
  /** URL 信息 */
  url: {
    /** 认证 cookie */
    auth_cookie?: {
      /** 过期时间 */
      expire: string
      /** 名称 */
      name: string
      /** 路径 */
      path: string
      /** 值 */
      value: string
    }
    /** 下载地址 */
    url: string
  }
}
