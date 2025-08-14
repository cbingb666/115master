import type { PaginationParams, Sorter } from '@/utils/drive115/api/entity'

export interface AndroidFilesImglist extends PaginationParams, Sorter {
  /** 目录 ID */
  cid: string
  /** 只罗列当前目录 */
  cur?: 0 | 1
}
