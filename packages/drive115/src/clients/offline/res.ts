import type { ApiResponseBase } from '../../share/base.ts'

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

/** 云下载默认保存目录 */
export type OfflineDownloadPath = ApiResponseBase<{
  data: {
    /** 目录 ID */
    file_id: string
    /** 目录名 */
    file_name: string
  }[]
}>

/** 离线任务 */
export interface OfflineTask {
  info_hash: string
  name: string
  size: number
  url: string
  /** 关联目录 ID（BT 任务为任务目录，直链任务为下载目录） */
  file_id: string
  /** 添加时间 */
  add_time: number
  /** 最后更新时间 */
  last_update: number
  left_time: number
  peers: number
  /** 完成进度（<=100） */
  percentDone: number
  /** 下载速率（B/s） */
  rateDownload: number
  /** 转存状态：0 未转存，1 已转存，2 部分转存 */
  move: number
  /** 状态：-1 失败，1 下载中，2 已完成，4 资源寻找中 */
  status: number
}

/** 离线任务列表 */
export type OfflineTaskLists = ApiResponseBase<{
  /** 任务总数 */
  count: number
  /** 配额 */
  quota: number
  /** 总页数 */
  page_count: number
  /** 当前页码 */
  page: number
  /** 每页条数 */
  page_row: number
  total: number
  tasks: OfflineTask[]
}>

/** 添加单个离线任务 */
export type OfflineAddUrl = ApiResponseBase<{
  info_hash: string
  name?: string
  url: string
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

/** 种子文件条目 */
export interface OfflineTorrentFile {
  /** 文件在种子内的路径 */
  path: string
  /** 文件大小 */
  size: number
  /** 是否默认选中：1 选中，0 未选中 */
  wanted: 0 | 1
}

/** 解析种子 */
export type OfflineTorrent = ApiResponseBase<{
  info_hash: string
  /** 任务名 */
  torrent_name: string
  /** 总大小 */
  file_size: number
  /** 文件数 */
  file_count: number
  /** 文件列表 */
  torrent_filelist_web: OfflineTorrentFile[]
}>

/** 添加 BT 离线任务 */
export type OfflineAddTaskBt = ApiResponseBase<{
  info_hash: string
}>

/** 删除离线任务 */
export type OfflineTaskDel = ApiResponseBase<Record<string, never>>

/** 清空离线任务 */
export type OfflineTaskClear = ApiResponseBase<Record<string, never>>
