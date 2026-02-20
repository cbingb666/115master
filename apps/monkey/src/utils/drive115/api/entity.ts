/** 播放列表项 */
export interface PlaylistItem {
  cid: string
  /** 星标 */
  m: number
  /** 文件名 */
  n: string
  /** pickcode */
  pc: string
  /** 文件大小 */
  s: number
  /** 创建时间 */
  createTime: number
  /** 播放时长 */
  play_long: number
  /** 当前时间 */
  current_time: number
  /** sha1 */
  sha: string
}

/** 路径项 */
export interface PathItem {
  cid: string
  name: string
  aid: string
  pid: string
  p_cid: string
  isp: string
  iss: string
  fv: string
  fvs: string
}

/** 内置字幕项 */
export interface MoviesSubtitleItemBuiltIn {
  /** 语言 */
  language: string
  /** 字幕ID */
  sid: string
  /** 字幕标题 */
  title: string
  /** 字幕类型 */
  type: 'srt' | 'ass' | 'vtt'
  /** url */
  url: string
}

/** 上传字幕项 */
export interface MoviesSubtitleItemUpload extends MoviesSubtitleItemBuiltIn {
  caption_map_id: string
  /** 文件ID */
  file_id: string
  /** 文件名 */
  file_name: string
  /** 是否是字幕映射 */
  is_caption_map: boolean
  /** 文件提取码 */
  pick_code: string
  /** sha1 */
  sha1: string
  /** 同步时间 */
  sync_time: number
}

/** 字幕项 */
export type MoviesSubtitleItem = MoviesSubtitleItemBuiltIn & MoviesSubtitleItemUpload
