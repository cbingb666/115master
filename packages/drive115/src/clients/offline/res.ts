import type { ApiResponseBase } from '../../share/shared.ts'

/** 获取离线空间 */
export type OfflineSpace = ApiResponseBase<{
  /** 签名 */
  sign: string
  bt_url: string
  data: number
  limit: number
  size: string
  time: number
  url: string
}>

/** 获取离线配额 */
export type OfflineGetQuotaPackageInfo = ApiResponseBase<{
  /** 总计 */
  count: number
  /** 剩余 */
  surplus: number
  /** 已使用 */
  used: number
  /** 包 */
  package: {
    /** 名称 */
    name: string
    /** 总计 */
    count: number
    /** 剩余 */
    surplus: number
    /** 已使用 */
    used: number
    /** 过期信息 */
    expire_info: unknown
  }[]
  max_size: number
}>

/** 添加一组离线任务 */
export type OfflineAddUrls = ApiResponseBase<{
  result: ApiResponseBase<{
    info_hash: string
    state: boolean
    files: {
      id: string
      name: string
      size: number
    }[]
    url: string
  }>[]
}>
