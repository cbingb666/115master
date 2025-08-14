import type { FilesItem, MoviesSubtitleItem, PathItem, Sorter } from '@/utils/drive115/api/entity'

/** 基础类型 */
type Base<T> = {
  state: boolean
  errNo: number
  error: string
} & T

/** 获取文件列表 */
export type Files = Base<{
  /** 总数 */
  count: number
  /** 文件数量 */
  file_count: number
  /** 目录数量 */
  folder_count: number
  /** 是否升序 */
  is_asc: Sorter['asc']
  /** 排序方式 */
  order: Sorter['o']
  /** 是否混合排序 */
  fc_mix: Sorter['fc_mix']
  /** 偏移量 */
  offset: number
  /** 当前页 */
  cur: number
  /** 数据 */
  data: FilesItem[]
  /** 路径 */
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

/** 文件信息 */
export type FilesIndexInfo = Base<{
  data: {
    /** 空间信息 */
    space_info: {
      /** 剩余空间 */
      all_remain: {
        size: number
        size_format: string
      }
      /** 已用空间 */
      all_use: {
        size: number
        size_format: string
      }
      /** 总空间 */
      all_total: {
        size: number
        size_format: string
      }
    }
  }
}>

/** 设置文件排序 */
export type PostFilesOrder = Base<unknown>

/** 重命名文件 */
export type PostFilesBatchRename = Base<unknown>

/** 添加文件夹 */
export type PostFilesAdd = Base<unknown>

/** 删除文件 */
export type PostRbDelete = Base<unknown>

/** 移动文件 */
export type PostFilesMove = Base<unknown>

/** 获取移动进度 */
export type GetFilesMoveProgress = Base<{
  /** 进度 (0-100) */
  progress: number
}>

/** 搜索 */
export type GetFilesSearch = Base<{
  /** 数据 */
  data: FilesItem[]
  /** 总数 */
  count: number
  /** 是否升序 */
  is_asc: Sorter['asc']
  /** 排序方式 */
  order: Sorter['o']
  /** 偏移量 */
  offset: number
  /** 当前页 */
  cur: number
}>

/** 获取图片列表 */
export type GetFilesImglist = Base<{
  /** 数据 */
  data: FilesItem[]
  /** 总数 */
  count: number
}>

/** 获取图片 */
export type GetFilesImage = Base<{
  data: {
    /** 所有图片 URL */
    all_url: string[]
    /** 文件名 */
    file_name: string
    /** 文件 SHA1 */
    file_sha1: string
    /** 未压缩 URL */
    origin_url: string
    /** 提取码 */
    pick_code: string
    /** 源文件 URL */
    source_url: string
    /** 图片 URL */
    url: string
  }
}>

/** 置顶文件 */
export type PostFilesTop = Base<unknown>
