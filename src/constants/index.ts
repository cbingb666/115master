// 是否为 plus 版本
export const PLUS_VERSION = import.meta.env.VITE_PLUS_VERSION

// CDN
export const CDN_BASE_URL = 'https://fastly.jsdelivr.net'

// MASTER BASE URL
export const MASTER_BASE_URL = 'https://115.com/web/lixian/master'

/** 友好错误信息 */
export const FRIENDLY_ERROR_MESSAGE = {
  // 未知错误
  UNKNOWN_ERROR: '未知错误',
  // 视频未转码，无法获取封面
  CANNOT_VIDEO_COVER_WITHOUT_TRANSCODING: '视频未转码，无法获取封面',
}

/** 分页默认每页大小 */
export const PAGINATION_DEFAULT_PAGE_SIZE = 256

/** 分页默认每页大小选项 */
export const PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS = [30, 50, 100, 300, 500, 1000]
