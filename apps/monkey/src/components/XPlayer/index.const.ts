import type { ValueOf } from 'type-fest'

export const MEDIA_ERROR_NAME = {
  [MediaError.MEDIA_ERR_ABORTED]: 'Aborted',
  [MediaError.MEDIA_ERR_NETWORK]: 'Network Error',
  [MediaError.MEDIA_ERR_DECODE]: 'Decode Error',
  [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: 'Source Not Supported',
}

/**
 * 视频源扩展名
 */

export const VIDEO_SOURCE_EXTENSION = {
  mp4: 'mp4',
  m3u8: 'm3u8',
  m2ts: 'm2ts',
  ts: 'ts',
  flv: 'flv',
  avi: 'avi',
  mkv: 'mkv',
  rmvb: 'rmvb',
  mov: 'mov',
  webm: 'webm',
  iso: 'iso',
  unknown: 'unknown',
}

/**
 * AvPlayer 启用的视频源扩展名
 */
export const AVPLAYER_ENABLED_EXTENSIONS = [
  VIDEO_SOURCE_EXTENSION.mkv,
  VIDEO_SOURCE_EXTENSION.avi,
] satisfies ValueOf<typeof VIDEO_SOURCE_EXTENSION>[]
