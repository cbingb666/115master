import type { BaseParams, PaginationParams, Sorter } from '../entity.ts'

/** 获取文件搜索结果请求参数 */
export interface GetFilesSearch extends BaseParams, PaginationParams, Sorter {
  /** 空间ID */
  aid: number
  /** 目录ID */
  cid?: string
  /** 文件后缀 */
  suffix?: string
  /** 文件类型 1.文档；2.图片；3.音乐；4.视频；5.压缩；6.应用；7.书籍 */
  type?: number
  /** 是否星标 */
  star?: number
  /** 搜索内容 */
  search_value: string
  /** 是否统计目录数，这样就会增加 "folder_count" 和 "file_count" 字段作为统计 */
  count_folders?: 0 | 1
  /** 筛选日期，格式为 YYYY-MM-DD（或者 YYYY-MM 或 YYYY），具体可以看文件信息中的 "t" 字段的值 */
  date?: string
  /** 是否目录和文件混合，如果为 0 则目录在前（目录置顶） */
  fc_mix?: 0 | 1
  /** 标签 id */
  file_label?: string
  /** 提取码 */
  pick_code?: string
  /** 是否显示目录 */
  show_dir?: 0 | 1
  /** 来源 */
  source?: string
}

/** 获取文件列表 */
export interface GetFiles extends BaseParams, PaginationParams, Sorter {
  /** 空间ID */
  aid: number
  /** 目录ID */
  cid?: string
  /** 文件后缀 */
  suffix?: string
  /** 文件类型 1.文档；2.图片；3.音乐；4.视频；5.压缩；6.应用；7.书籍 */
  type?: number
  /** 是否星标 */
  star?: number
  /** 是否只搜索当前目录 */
  cur?: 0 | 1
  /** 是否自然排序 */
  natsort?: 0 | 1
  /** 是否目录和文件混合，如果为 0 则目录在前（目录置顶） */
  fc_mix?: 0 | 1
  /**
   * 是否自定义排序
   * @description 启用自定义排序，如果指定了 "asc"、"fc_mix"、"o" 中其一，则需要设置此参数为 1 或 2
   * 0: 使用记忆排序（自定义排序失效）
   * 1: 使用自定义排序（不使用记忆排序）
   * 2: 自定义排序（非目录置顶）
   */
  custom_order?: 0 | 1 | 2
  /** 不显示文件夹 */
  nf?: string
  /** 是否显示目录 */
  show_dir?: 0 | 1
  qid?: number
  source?: string
  is_q?: string
  is_share?: string
  r_all?: number
}

/** 获取视频文件信息请求 */
export interface GetFilesVideo {
  pickcode: string
  share_id: string
  local: string
}

/** 文件星标状态 */
export enum MarkStatus {
  Mark = '1',
  Unmark = '0',
}

/** 文件星标请求 */
export interface FilesStar {
  file_id: string | string[]
  star: MarkStatus
}

/** 播放历史请求基础 */
interface FilesHistoryBase {
  category: '1'
  share_id: string
  pick_code: string
}

/** 获取播放历史请求 */
export type GetFilesHistory = FilesHistoryBase & {
  fetch: 'one'
}

/** 更新播放历史请求 */
export type PostFilesHistory = FilesHistoryBase & {
  op: 'update'
  time: number
  definition: '0'
}

/** 获取电影字幕请求 */
export interface GetMoviesSubtitle {
  pickcode: string
}

/** 获取文件信息请求 */
export interface GetFilesIndexInfo {
}

/**
 * 设置文件排序
 */
export interface PostFilesOrder {
  /** 文件ID */
  file_id: string
  /** 排序方式 */
  user_order: string
  /** 是否升序 */
  user_asc: number
  /** 目录置顶 (是否混合排序) */
  fc_mix?: number
}

/** 重命名文件请求 */
export interface PostFilesBatchRename {
  [key: `files_new_name[${number}]`]: string
  fid?: string
  file_name?: string
}

/** 添加文件夹请求 */
export interface PostFilesAdd {
  /** 父级ID */
  pid: string
  /** 文件夹名称 */
  cname: string
}

/** 删除文件请求 */
export interface PostRbDelete {
  [key: `fid[${number}]`]: string
  /** 父级ID */
  pid: string
  /** 文件或目录的 id，多个用逗号 "," 隔开 */
  fid?: string
}

/** 移动文件请求 */
export interface PostFilesMove {
  [key: `fid[${number}]`]: string
  /** 目标目录 id */
  pid: string
  /** 文件或目录 id，只接受单个 id */
  fid?: string
  /** 移动任务 id */
  move_proid?: string
}

/** 获取移动进度请求 */
export interface GetFilesMoveProgress {
  /** 移动任务 id */
  move_proid: string
}

/** 获取图片列表请求 */
export interface GetFilesImglist extends BaseParams, PaginationParams, Sorter {
  /** 目录 ID */
  cid: string
  /** 文件 ID */
  file_id: string
  next: 0 | 1
}

/** 获取图片请求 */
export interface GetFilesImage {
  /** 提取码 */
  pickcode: string
}

/** 置顶文件请求 */
export interface PostFilesTop {
  /** 文件或目录的 id，多个用逗号 "," 隔开 */
  file_id: string
  /** 是否置顶 */
  top: 0 | 1
}
