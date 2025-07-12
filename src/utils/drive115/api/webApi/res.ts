import type { MoviesSubtitleItem, PathItem, PlaylistItem } from '../entity'

/** 基础类型 */
type Base<T> = {
  state: boolean
  errNo: number
} & T

/** 获取文件列表 */
export type Files = Base<{
  data: PlaylistItem[]
  path: PathItem[]
}>

/** 应用浏览器下载 */
export type FilesAppChromeDown = Base<{
  data: {
    [key: string]: {
      url: {
        url: string
      }
    }
  }
}>

/** 下载 */
export type FilesDownload = Base<{
  file_url: string
}>

/** 视频文件信息 */
export type FilesVideo = Base<{
  /** 是否开启内嵌字幕 */
  inlay_power: number
  /** 是否开启视频推送 */
  video_push_state: boolean
  /** 下载地址 */
  download_url: string[]
  /** 文件状态 */
  file_status: number
  /** 缩略图 */
  thumb_url: string
  /** 视频高度 */
  height: string
  /** 视频宽度 */
  width: string
  /** 视频地址 */
  video_url: string
  /** 视频地址（demo） */
  video_url_demo: string
  /** 定义列表 */
  definition_list: {
    [key: string]: string
  }
  /** 多轨道列表 */
  multitrack_list: string[]
  /** 播放时长 */
  play_long: string
  /** 字幕信息 */
  subtitle_info: string[]
  /** 大纲信息 */
  outline_info: string[]
  /** 选集代码 */
  pick_code: string
  /** 文件名 */
  file_name: string
  /** 文件大小 */
  file_size: string
  /** 父级ID */
  parent_id: string
  /** 文件ID */
  file_id: string
  /** 是否标记 */
  is_mark: string
  /** SHA1 */
  sha1: string
  /** 音频列表 */
  audio_list: string
  /** 用户定义 */
  user_def: number
  /** 用户旋转 */
  user_rotate: number
  /** 用户翻转 */
  user_turn: number
}>

/** 收藏 */
export type FilesStar = Base<unknown>

/** 播放历史 */
export type FilesHistory = Base<{
  data: {
    add_time: number
    category: number
    file_name: string
    hash: string
    pick_code: string
    thumb: string
    time: number
  }
}>

/** 电影字幕 */
export type MoviesSubtitle = Base<{
  data: {
    autoload: MoviesSubtitleItem
    list: MoviesSubtitleItem[]
  }
}>
