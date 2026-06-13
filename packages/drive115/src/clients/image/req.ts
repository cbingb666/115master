import type { BaseParams, PaginationParams, Sorter } from '../../api/entity.ts'

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

/** Pro 获取图片列表请求 */
export interface AndroidFilesImglist extends PaginationParams, Sorter {
  /** 目录 ID */
  cid: string
  /** 只罗列当前目录 */
  cur?: 0 | 1
}
