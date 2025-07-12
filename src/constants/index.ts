// 是否为 plus 版本
export const PLUS_VERSION = import.meta.env.VITE_PLUS_VERSION

// CDN
export const CDN_BASE_URL = 'https://fastly.jsdelivr.net'

/** 友好错误信息 */
export const FRIENDLY_ERROR_MESSAGE = {
  // 未知错误
  UNKNOWN_ERROR: '未知错误',
  // 视频未转码，无法获取封面
  CANNOT_VIDEO_COVER_WITHOUT_TRANSCODING: '视频未转码，无法获取封面',
}
