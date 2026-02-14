type ResBase<T> = {
  state: boolean
  code: number
  errNo: number
  error: string
  error_msg: string
} & T

/** 获取视频 m3u8 地址 */
export type VideoM3u8 = ResBase<string>

/** 获取离线空间 */
export type OfflineSpace = ResBase<{
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
export type OfflineGetQuotaPackageInfo = ResBase<{
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
export type OfflineAddUrls = ResBase<{
  result: ResBase<{
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
