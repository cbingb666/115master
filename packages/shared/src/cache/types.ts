import type { ILogger } from '../logger/types.ts'

/** CacheCore 配置选项 */
export interface CacheCoreOptions {
  /** 缓存数据库名称 */
  name?: string
  /** 存储实例名称 */
  storeName?: string
  /** 数据库版本 */
  version?: number
  /** 数据库描述 */
  description?: string
  /** 存储驱动 */
  driver?: string | string[]
  /** 存储大小限制 */
  size?: number
  /** 是否启用空间限额管理（默认 true） */
  enableQuotaManagement?: boolean
  /** 日志实例，未提供时使用 console */
  logger?: ILogger
}

/** 缓存项接口 */
export interface CacheValue<T> {
  /** 缓存值 */
  value: T
  /** 缓存项大小（字节） */
  size?: number
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
  /**
   * 版本
   * (1.6.2 以前没有向 Value 写入此字段, 此版本是 Cache 版本与项目版本无关)
   * 目前它用于在 Get 时删除旧版本的缓存项 (默认行为)
   */
  version?: number
}

/** 缓存元数据项 */
export interface CacheMetaItem {
  /** 原始缓存键 */
  key: string
  /** 完整键（包含 storeName） */
  fullKey: string
  /** 存储实例名称 */
  storeName: string
  /** 最后访问时间戳 */
  lastAccessed: number
  /** 缓存项大小（字节） */
  size?: number
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}

/** 存储空间使用情况 */
export interface StorageUsage {
  /** 已使用空间（字节） */
  usage: number
  /** 总空间配额（字节） */
  quota: number
  /** 使用率（0-1之间） */
  usageRatio: number
}
