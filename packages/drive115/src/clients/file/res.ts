import type { ApiResponseBase, Sorter } from '../../share/base.ts'
import type { FilesItem, MoviesSubtitleItem, PathItem, RbItem } from '../../share/entity.ts'

/** 获取文件列表 */
export type Files = ApiResponseBase<{
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
  /** 目录置顶 (是否混合排序) */
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

/** 收藏 */
export type FilesStar = ApiResponseBase<unknown>

/** 播放历史 */
export type FilesHistory = ApiResponseBase<{
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
export type MoviesSubtitle = ApiResponseBase<{
  data: {
    autoload: MoviesSubtitleItem
    list: MoviesSubtitleItem[]
  }
}>

/** 文件信息 */
export type FilesIndexInfo = ApiResponseBase<{
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
export type PostFilesOrder = ApiResponseBase<unknown>

/** 重命名文件 */
export type PostFilesBatchRename = ApiResponseBase<unknown>

/** 添加文件夹 */
export type PostFilesAdd = ApiResponseBase<unknown>

/** 删除文件 (移入回收站) */
export type PostRbDelete = ApiResponseBase<{
  errno: string
}>

/** 获取回收站列表 */
export interface GetRbList {
  state: boolean
  error: string
  /** 总数 */
  count: string
  /** 是否已设回收站密码 */
  rb_pass: number
  /** 偏移量 */
  offset: number
  /** 每页大小 */
  page_size: number
  /** 排序方式 */
  order: string
  /** 是否升序 */
  is_asc: number
  /** 数据 */
  data: RbItem[]
}

/** 还原回收站文件 */
export type PostRbRevert = ApiResponseBase<{
  errno: string
}>

/** 彻底删除回收站文件 */
export type PostRbClean = ApiResponseBase<{
  errno: string
}>

/** 清空回收站 */
export type PostRbCleanAll = ApiResponseBase<{
  errno: string
}>

/** 回收站文件属性 */
export type GetRbInfo = ApiResponseBase<{
  data: Record<string, string>
}>

/** 移动文件 */
export type PostFilesMove = ApiResponseBase<unknown>

/** 获取移动进度 */
export type GetFilesMoveProgress = ApiResponseBase<{
  /** 进度 (0-100) */
  progress: number
}>

/** 搜索 */
export type GetFilesSearch = ApiResponseBase<{
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

/** 置顶文件 */
export type PostFilesTop = ApiResponseBase<unknown>

/** 文件评分 */
export type FilesScore = ApiResponseBase<unknown>
