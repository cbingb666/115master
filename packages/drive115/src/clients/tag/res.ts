import type { ApiResponseBase } from '../../share/base.ts'
import type { TagItem } from '../../share/entity.ts'

/** 标签信息 */
export interface LabelInfo {
  /** 标签 id */
  id: string
  /** 标签名称 */
  name: string
  /** 排序权重，数字越大越靠后 */
  sort?: string | number
  /** 颜色，16 进制字符串 */
  color?: string
  /** 更新时间（秒级时间戳） */
  update_time?: number
  /** 创建时间（秒级时间戳） */
  create_time?: number
}

/** 标签列表响应 */
export type Labels = ApiResponseBase<{
  data?: {
    /** 总数 */
    total?: number
    /** 标签列表 */
    list?: LabelInfo[]
    /** 排序字段 */
    sort?: string
    /** 排序方向 */
    order?: 'asc' | 'desc'
  }
}>

/** 创建标签响应 */
export type LabelsAdd = ApiResponseBase<{
  /** 新建的标签 */
  data?: LabelInfo[]
}>

/** 编辑标签响应 */
export type LabelEdit = ApiResponseBase<unknown>

/** 删除标签响应 */
export type LabelDelete = ApiResponseBase<unknown>

/** 给文件设置标签响应 */
export type FileLabels = ApiResponseBase<unknown>

/** 标签排序响应 */
export type LabelOrder = ApiResponseBase<unknown>

/** 按标签筛选文件响应（沿用文件搜索的 shape，data 为带 fl 字段的文件列表） */
export type FilesByLabel = ApiResponseBase<{
  /** 总数 */
  count?: number
  /** 数据 */
  data?: FilesByLabelItem[]
  /** 排序字段 */
  order?: string
  /** 是否升序 */
  is_asc?: 0 | 1
  /** 偏移量 */
  offset?: number
  /** 当前页 */
  cur?: number
}>

/** 按标签筛选时的文件项 */
export interface FilesByLabelItem {
  [key: string]: unknown
  /** 文件 id */
  fid?: string
  /** 文件名 */
  n?: string
  /** 文件标签 */
  fl?: TagItem[]
}
