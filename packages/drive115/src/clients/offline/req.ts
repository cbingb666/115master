/** 离线签名参数（取自 getOfflineSpace 返回的 sign/time） */
export interface OfflineSign {
  /** 用户 ID（部分接口需要） */
  uid?: string | number
  /** 签名 */
  sign: string
  /** 时间戳 */
  time: number
}

/** 获取离线空间 */
export interface OfflineSpace {}

/** 获取离线配额 */
export interface OfflineGetQuotaPackageInfo {}

/** 获取云下载默认保存目录 */
export interface OfflineDownloadPath {
  limit?: number
}

/** 离线任务列表 */
export interface OfflineTaskLists extends OfflineSign {
  /** 页码 */
  page?: number
}

/** 添加单个离线任务 */
export interface OfflineAddUrl extends OfflineSign {
  url: string
  wp_path_id: string
}

/** 添加一组离线任务 */
export interface OfflineAddUrls extends OfflineSign {
  [key: `url[${number}]`]: string
  wp_path_id: string
}

/** 解析种子（种子文件需先上传到网盘，取回 pickcode 与 sha1） */
export interface OfflineTorrent extends OfflineSign {
  pickcode: string
  sha1: string
}

/** 添加 BT 离线任务 */
export interface OfflineAddTaskBt extends OfflineSign {
  info_hash: string
  /** 要下载的文件索引（对应解析种子返回的顺序），逗号分隔 */
  wanted: string
  /** 保存目录名 */
  savepath: string
}

/** 删除离线任务 */
export interface OfflineTaskDel extends OfflineSign {
  [key: `hash[${number}]`]: string
  /** 是否同时删除源文件：1 删除，0 保留 */
  flag?: 0 | 1
}

/** 清空离线任务 */
export interface OfflineTaskClear extends OfflineSign {
  /** 清空类型：0 全部、1 已完成、2 失败 等 */
  flag: number
}
