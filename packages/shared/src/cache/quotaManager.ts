import type { ILogger } from '../logger/types.ts'
import type { StorageUsage } from './types.ts'
import { CLEANUP_BATCH_SIZE, STORAGE_QUOTA_THRESHOLD } from './const.ts'
import { MetaStore } from './metaStore.ts'

/**
 * 空间限额管理器
 * 用于监控存储空间使用情况并在需要时清理旧数据
 */
export class QuotaManager {
  /** 日志 */
  protected logger: ILogger
  /** 元数据存储 */
  private metaStore: MetaStore
  /** 删除缓存项的回调 */
  private removeItem: (key: string) => Promise<void>

  /**
   * 构造函数
   * @param removeItem 删除缓存项的回调
   * @param name 缓存名称
   * @param storeName 存储实例名称
   * @param logger 日志实例
   */
  constructor(
    removeItem: (key: string) => Promise<void>,
    name: string,
    storeName: string,
    logger: ILogger = console as unknown as ILogger,
  ) {
    this.removeItem = removeItem
    this.logger = logger.sub('QuotaManager')
    this.metaStore = new MetaStore(name, storeName, this.logger)
  }

  /**
   * 获取当前存储空间使用情况
   * @returns 存储空间使用情况
   */
  async getStorageUsage(): Promise<StorageUsage> {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const usageRatio = quota > 0 ? usage / quota : 0

      return {
        usage,
        quota,
        usageRatio,
      }
    }

    return {
      usage: 0,
      quota: 0,
      usageRatio: 0,
    }
  }

  /**
   * 检查是否需要清理存储空间
   * @returns 是否需要清理
   */
  async shouldCleanup(): Promise<boolean> {
    const { usageRatio } = await this.getStorageUsage()
    return usageRatio > STORAGE_QUOTA_THRESHOLD
  }

  /**
   * 清理旧数据
   * @param batchSize 每批清理的数量，默认使用常量定义的值
   * @returns 已清理的键数组
   */
  async cleanup(batchSize = CLEANUP_BATCH_SIZE): Promise<string[]> {
    const needCleanup = await this.shouldCleanup()
    if (!needCleanup)
      return []

    const oldestItems = await this.metaStore.getSortedByLastAccessed(true)

    if (oldestItems.length === 0)
      return []

    const itemsToCleanup = oldestItems.slice(0, batchSize)
    const cleanedKeys: string[] = []

    for (const item of itemsToCleanup) {
      try {
        await this.removeItem(item.key)
        await this.metaStore.removeMeta(item.key)
        cleanedKeys.push(item.key)
      }
      catch (error) {
        this.logger.error(`清理缓存项 ${item.key} 失败:`, error)
      }
    }

    this.logger.warn(`已清理 ${cleanedKeys.length} 个旧缓存项`)
    return cleanedKeys
  }

  /**
   * 记录缓存项访问
   * @param key 缓存键
   * @param size 缓存项大小（可选）
   * @param createdAt 创建时间（可选）
   * @param updatedAt 更新时间（可选）
   */
  async recordAccess(
    key: string,
    size?: number,
    createdAt?: number,
    updatedAt?: number,
  ): Promise<void> {
    await this.metaStore.updateMeta(key, size, createdAt, updatedAt)
  }

  /**
   * 记录缓存项删除
   * @param key 缓存键
   */
  async recordRemoval(key: string): Promise<void> {
    await this.metaStore.removeMeta(key)
  }

  /**
   * 清空所有元数据
   */
  async clearAllMeta(): Promise<void> {
    await this.metaStore.clear()
  }

  /**
   * 自动清理
   * 检查存储空间使用情况，如果超过阈值则进行清理
   * @returns 是否进行了清理
   */
  async autoCleanup(): Promise<boolean> {
    const needCleanup = await this.shouldCleanup()
    if (needCleanup) {
      const cleanedKeys = await this.cleanup()
      return cleanedKeys.length > 0
    }
    return false
  }
}
