import type { PaginationParams, Sorter } from '../entity.ts'

export interface AndroidFilesImglist extends PaginationParams, Sorter {
  /** 目录 ID */
  cid: string
  /** 只罗列当前目录 */
  cur?: 0 | 1
}
