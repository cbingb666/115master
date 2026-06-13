import type { ApiResponseBase, FilesItem } from '../../api/entity.ts'

/** 获取图片列表 */
export type GetFilesImglist = ApiResponseBase<{
  /** 数据 */
  data: FilesItem[]
  /** 总数 */
  count: number
}>

/** 获取图片 */
export type GetFilesImage = ApiResponseBase<{
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

/** Pro 获取图片列表 */
export type AndroidFilesImglist = ApiResponseBase<unknown>
