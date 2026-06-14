import type { ILogger } from '../logger/types.ts'
import type { CacheCoreOptions, CacheValue } from './types.ts'
import localforage from 'localforage'
import { DEFAULT_STORE_NAME } from './const.ts'
import { QuotaManager } from './quotaManager.ts'

/**
 * 缓存核心类
 * @description 基于 localforage 的通用缓存基类，支持 TTL/version、大小估算与配额超限自动清理
 */
export class CacheCore<T> {
  /** 存储实例 */
  storage: LocalForage
  /** 储存配置 */
  storageOptions: LocalForageOptions
  /** 日志 */
  protected logger
  /** 空间限额管理器 */
  private quotaManager: QuotaManager
  /** 是否启用空间限额管理 */
  private enableQuotaManagement: boolean
  /** 缓存名称 */
  private name: string
  /** 存储实例名称 */
  private storeName: string

  /**
   * 构造函数
   * @param options 存储配置
   */
  constructor(options: CacheCoreOptions = {}) {
    const { enableQuotaManagement = true, logger = console as unknown as ILogger, ...storageOptions } = options
    this.storageOptions = storageOptions
    this.logger = logger

    this.name = storageOptions.name || DEFAULT_STORE_NAME
    this.storeName = storageOptions.storeName || 'cache'

    this.storage = localforage.createInstance({
      name: this.name,
      storeName: this.storeName,
      version: 1,
      description: 'cache',
      driver: localforage.INDEXEDDB,
      ...storageOptions,
    })

    this.enableQuotaManagement = enableQuotaManagement
    this.quotaManager = new QuotaManager(
      async key => this.storage.removeItem(key),
      this.name,
      this.storeName,
      logger,
    )
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存值
   */
  async get(key: string): Promise<CacheValue<T> | null> {
    const cache = await this.storage.getItem<CacheValue<T>>(key)

    if (cache && this.enableQuotaManagement)
      await this.quotaManager.recordAccess(key, cache.size)

    if ((cache?.version || 0) < (this.storageOptions.version || 0)) {
      this.remove(key)
      return null
    }

    return cache
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param value 缓存值
   */
  async set(key: string, value: T): Promise<void> {
    try {
      let size: number | undefined
      if (this.enableQuotaManagement)
        size = this.estimateSize(value, key)

      const now = Date.now()
      const existingCache = await this.storage.getItem<CacheValue<T>>(key)

      const cacheValue: CacheValue<T> = {
        value,
        ...(size !== undefined ? { size } : {}),
        createdAt: existingCache?.createdAt || now,
        updatedAt: now,
        version: this.storageOptions.version,
      }

      await this.storage.setItem(key, cacheValue)

      if (this.enableQuotaManagement) {
        await this.quotaManager.recordAccess(
          key,
          size,
          cacheValue.createdAt,
          cacheValue.updatedAt,
        )

        await this.quotaManager.autoCleanup()
      }
    }
    catch (error) {
      if (
        error instanceof DOMException
        && error.name === 'QuotaExceededError'
      ) {
        this.logger.error('缓存失败: 超出配额')

        if (this.enableQuotaManagement) {
          const cleaned = await this.quotaManager.cleanup()
          if (cleaned.length > 0)
            await this.set(key, value)
        }
      }
      else {
        this.logger.error('缓存失败:', error)
      }
    }
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  async remove(key: string) {
    await this.storage.removeItem(key)

    if (this.enableQuotaManagement)
      await this.quotaManager.recordRemoval(key)
  }

  /**
   * 清空缓存
   */
  async clear() {
    await this.storage.clear()

    if (this.enableQuotaManagement)
      await this.quotaManager.clearAllMeta()
  }

  /**
   * 获取空间限额管理器
   * @returns 空间限额管理器实例
   */
  getQuotaManager(): QuotaManager {
    return this.quotaManager
  }

  /**
   * 获取缓存项的创建时间
   * @param key 缓存键
   * @returns 创建时间戳，如果缓存项不存在则返回 undefined
   */
  async getCreatedAt(key: string): Promise<number | undefined> {
    const cache = await this.storage.getItem<CacheValue<T>>(key)
    return cache?.createdAt
  }

  /**
   * 获取缓存项的更新时间
   * @param key 缓存键
   * @returns 更新时间戳，如果缓存项不存在则返回 undefined
   */
  async getUpdatedAt(key: string): Promise<number | undefined> {
    const cache = await this.storage.getItem<CacheValue<T>>(key)
    return cache?.updatedAt
  }

  /**
   * 获取缓存项的年龄（从创建到现在的时间）
   * @param key 缓存键
   * @returns 缓存项年龄（毫秒），如果缓存项不存在则返回 undefined
   */
  async getAge(key: string): Promise<number | undefined> {
    const createdAt = await this.getCreatedAt(key)
    if (createdAt === undefined)
      return undefined
    return Date.now() - createdAt
  }

  /**
   * 获取缓存项的新鲜度（从上次更新到现在的时间）
   * @param key 缓存键
   * @returns 缓存项新鲜度（毫秒），如果缓存项不存在则返回 undefined
   */
  async getFreshness(key: string): Promise<number | undefined> {
    const updatedAt = await this.getUpdatedAt(key)
    if (updatedAt === undefined)
      return undefined
    return Date.now() - updatedAt
  }

  /**
   * 估算数据大小
   * @param value 需要估算大小的数据
   * @param key 缓存键（用于日志记录）
   * @returns 估算的数据大小（字节）或 undefined（如果无法估算）
   */
  private estimateSize(value: T, key: string): number | undefined {
    try {
      if (value instanceof Blob)
        return value.size

      if (
        Array.isArray(value)
        && value.length > 0
        && value[0] instanceof Blob
      ) {
        return value.reduce((total, item) => {
          if (item instanceof Blob)
            return total + item.size
          return total
        }, 0)
      }

      const valueStr = JSON.stringify(value)
      return new Blob([valueStr]).size
    }
    catch (e) {
      this.logger.warn(`无法估算缓存项 ${key} 的大小:`, e)
      return undefined
    }
  }
}
