/** 基础请求参数 */
export interface BaseParams {
  /**
   * 返回格式
   */
  format?: 'json'
}

/** 分页请求 */
export interface PaginationParams {
  /** 偏移量 */
  offset: number
  /** 限制数量 */
  limit: number
}

/** 分页响应 */
export interface PaginationResponse<T> {
  /** 总数 */
  count: number
  /** 数据 */
  data: T[]
  /** 当前页 */
  cur: number
  /** 是否升序 */
  is_asc: number
}

/** 排序 */
export interface Sorter {
  /** 排序方式 */
  o?: 'file_name' | 'user_utime' | 'user_ptime' | 'user_otime' | 'file_size'
  /** 是否升序 */
  asc?: 0 | 1
  /** 是否混合排序 */
  fc_mix?: 0 | 1
}

export interface TagItem {
  /** 颜色 */
  color: string
  /** 创建时间 */
  create_time: number
  /** 标签ID */
  id: string
  /** 名称 */
  name: string
  /** 排序 */
  sort: string
  /** 更新时间 */
  update_time: number
}

/** 文件项基础 */
export interface FileItemBase {
  /** 星标 */
  m: '0' | '1' | 0 | 1
  /** 文件名 */
  n: string
  /** 文件名带高亮html */
  ns: string
  /** pickcode */
  pc: string
  /** 文件大小 */
  s: number | string
  /** 创建时间 */
  t: number
  /** 更新时间 */
  tu: number
  /** 播放时长 */
  play_long: number
  /** 当前时间 */
  current_time: number
  /** sha1 */
  sha: string
  /** 是否是视频 */
  iv: number
  /** 文件分类。0 文件夹，1 文件 */
  fc: 0 | 1
  /** 文件后缀名 */
  ico: string
  /** 父级ID */
  pid: string
  /**
   * 视频清晰度
   * 1 标清
   * 2 高清
   * 3 超清
   * 4 1080P
   * 5 4K
   * 100 原画
   */
  vdi?: number
  /** 是否置顶 */
  is_top: number
  /** 标签 */
  fl?: TagItem[]
  /** 图片缩略图 */
  u: string
}

/** 文件项 */
export interface FileItem extends FileItemBase {
  fid: string
}

/** 目录项 */
export interface FolderItem extends FileItemBase {
  cid: string
}

/** 文件列表项 */
export type FilesItem = FileItem & FolderItem

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
  /** 目录ID */
  cid: string
  /** 目录名称 */
  name: string
  /** 空间ID */
  aid: string
  /** 父级ID */
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

/** 网盘字幕项 */
export interface MoviesSubtitleItemFile extends MoviesSubtitleItemBuiltIn {
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
export type MoviesSubtitleItem = MoviesSubtitleItemBuiltIn
  & MoviesSubtitleItemFile
