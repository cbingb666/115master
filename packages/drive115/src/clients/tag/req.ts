import type { PaginationParams } from '../../share/base.ts'

/** 获取标签列表请求参数 */
export interface GetLabels extends PaginationParams {
  /** 排序字段 */
  sort?: 'create_time' | 'update_time' | 'sort'
  /** 排序方向 */
  order?: 'asc' | 'desc'
}

/** 按关键字搜索标签请求参数 */
export interface SearchLabels extends PaginationParams {
  /** 搜索关键字 */
  keyword: string
}

/** 预设标签颜色 */
export const LabelColor = {
  Blank: '#000000',
  Red: '#FF4B30',
  Orange: '#F78C26',
  Yellow: '#FFC032',
  Green: '#43BA80',
  Blue: '#2670FC',
  Purple: '#8B69FE',
  Gray: '#CCCCCC',
} as const

export type LabelColorValue = typeof LabelColor[keyof typeof LabelColor]

/** 单个标签（用于创建时使用） */
export interface LabelItem {
  /** 标签名称 */
  name: string
  /** 标签颜色 (16 进制，如 #FF4B30) */
  color?: LabelColorValue | string
}

/** 编辑标签请求 */
export interface PostLabelEdit {
  /** 标签 id */
  id: string
  /** 新名称 */
  name: string
  /** 新颜色 */
  color?: LabelColorValue | string
}

/** 删除标签请求 */
export interface PostLabelDelete {
  /** 标签 id */
  id: string
}

/** 给文件设置标签请求 */
export interface PostFileLabels {
  /** 文件 id */
  fid: string
  /** 标签 id 列表，逗号分隔；传空串可清空标签 */
  file_label: string
}

/** 标签排序请求（实际调用 /files/order，module=label_search） */
export interface PostLabelOrder {
  /** 标签 id */
  file_id: string
  /** 排序方式 */
  user_order: string
  /** 是否升序 */
  user_asc: 0 | 1
  /** 目录置顶 */
  fc_mix?: 0 | 1
}

/** 按标签筛选文件请求参数 */
export interface GetFilesByLabel extends PaginationParams {
  /** 标签 id */
  file_label: string
  /** 目录 id，固定 0 */
  cid?: string
  /** 空间 id */
  aid?: number
  /** 排序字段 */
  o?: 'file_name' | 'user_utime' | 'user_ptime' | 'user_otime' | 'file_size'
  /** 是否升序 */
  asc?: 0 | 1
  /** 是否显示目录 */
  show_dir?: 0 | 1
  /** 是否统计目录数 */
  count_folders?: 0 | 1
  /** 文件后缀过滤 */
  suffix?: string
  /** 文件类型过滤 */
  type?: number
  /** 来源 */
  source?: string
  /** 返回格式 */
  format?: 'json'
}
