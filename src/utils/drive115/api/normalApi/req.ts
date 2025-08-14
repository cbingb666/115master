/** 获取离线空间 */
export interface OfflineSpace {}

/** 获取离线配额 */
export interface OfflineGetQuotaPackageInfo {}

/** 添加离线任务 */
export interface OfflineAddUrls {
  [key: `url[${number}]`]: string
  wp_path_id: string
  /** uid: string */
  sign: string
  time: number
}
