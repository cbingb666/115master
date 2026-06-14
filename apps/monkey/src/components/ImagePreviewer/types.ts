import type { Share } from '@115master/drive115'
/** 图片预览项 */
export interface ImagePreviewItem {
  /** 原图 URL */
  src: string
  /** 缩略图 URL */
  thumbSrc: string
  /** 文件名 */
  caption: string
  /** 文件数据 */
  fileData: Share.Entity.FilesItem
  /** 在总列表中的索引 */
  globalIndex: number
}

/** 图片页 */
export interface ImagePage {
  /** 页码（从 1 开始） */
  pageNum: number
  /** 该页图片列表 */
  items: ImagePreviewItem[]
  /** 是否已加载 */
  loaded: boolean
}

/** 页码信息 */
export interface PageInfo {
  /** 当前页 */
  current: number
  /** 总页数 */
  total: number
}

/** 预览器状态 */
export interface PreviewerState {
  /** 是否打开 */
  isOpen: boolean
  /** 当前页码 */
  currentPage: number
  /** 总页数 */
  totalPages: number
  /** 是否正在加载 */
  loading: boolean
  /** 当前页图片 */
  currentImages: ImagePreviewItem[]
  /** 当前页内索引 */
  currentIndex: number
}
