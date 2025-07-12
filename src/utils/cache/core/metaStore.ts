import localforage from 'localforage'
import { META_STORE_NAME, STORE_NAME } from './const'

export interface CacheMetaItem {
  /** 原始缓存键 */
  key: string
  /** 完整键（包含 name 和 storeName） */
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

/**
 * 元数据存储管理器
 * 用于跟踪缓存项的最后访问时间和大小
 */
export class MetaStore {
  /** 存储实例 */
  private storage: LocalForage
  /** 缓存名称 */
  private name: string
  /** 存储实例名称 */
  private storeName: string

  /**
   * 构造函数
   * @param name 缓存名称
   * @param storeName 存储实例名称
   */
  constructor(name: string = STORE_NAME, storeName = 'cache') {
    this.name = name
    this.storeName = storeName
    this.storage = localforage.createInstance({
      name: this.name,
      storeName: META_STORE_NAME,
      version: 1,
      description: '缓存元数据',
      driver: localforage.INDEXEDDB,
    })
  }

  /**
   * 更新缓存项的元数据
   * @param key 缓存键
   * @param size 缓存项大小（可选）
   * @param createdAt 创建时间（可选，如果不提供则使用现有值或当前时间）
   * @param updatedAt 更新时间（可选，如果不提供则使用当前时间）
   */
  async updateMeta(
    key: string,
    size?: number,
    createdAt?: number,
    updatedAt?: number,
  ): Promise<void> {
    try {
      const fullKey = this.generateFullKey(key)
      const now = Date.now()

      /** 获取现有元数据（如果存在） */
      const existingMeta = await this.getMeta(key)

      const meta: CacheMetaItem = {
        key,
        fullKey,
        storeName: this.storeName,
        lastAccessed: now,
        // 如果提供了创建时间，使用提供的值；否则使用现有值或当前时间
        createdAt: createdAt ?? existingMeta?.createdAt ?? now,
        // 如果提供了更新时间，使用提供的值；否则使用当前时间
        updatedAt: updatedAt ?? now,
      }

      if (size !== undefined) {
        meta.size = size
      }
      else if (existingMeta?.size !== undefined) {
        // 保留现有大小信息
        meta.size = existingMeta.size
      }

      await this.storage.setItem(fullKey, meta)
    }
    catch (error) {
      console.error('更新缓存元数据失败:', error)
    }
  }

  /**
   * 获取缓存项的元数据
   * @param key 缓存键
   */
  async getMeta(key: string): Promise<CacheMetaItem | null> {
    const fullKey = this.generateFullKey(key)
    return await this.storage.getItem<CacheMetaItem>(fullKey)
  }

  /**
   * 删除缓存项的元数据
   * @param key 缓存键
   */
  async removeMeta(key: string): Promise<void> {
    const fullKey = this.generateFullKey(key)
    await this.storage.removeItem(fullKey)
  }

  /**
   * 获取所有缓存项的元数据
   * @returns 所有缓存项的元数据数组
   */
  async getAllMeta(): Promise<CacheMetaItem[]> {
    const items: CacheMetaItem[] = []

    await this.storage.iterate<CacheMetaItem, void>((value) => {
      // 只返回属于当前 name 和 storeName 的元数据
      if (value.storeName === this.storeName) {
        items.push(value)
      }
    })

    return items
  }

  /**
   * 获取按最后访问时间排序的缓存项元数据
   * @param ascending 是否按升序排序（默认为true，即最旧的在前）
   * @returns 排序后的缓存项元数据数组
   */
  async getSortedByLastAccessed(
    ascending = true,
  ): Promise<CacheMetaItem[]> {
    const items = await this.getAllMeta()

    return items.sort((a, b) => {
      return ascending
        ? a.lastAccessed - b.lastAccessed
        : b.lastAccessed - a.lastAccessed
    })
  }

  /**
   * 清除所有元数据
   * 注意：只清除当前 name 和 storeName 的元数据
   */
  async clear(): Promise<void> {
    const allItems = await this.getAllMeta()

    for (const item of allItems) {
      await this.storage.removeItem(item.fullKey)
    }
  }

  /**
   * 获取缓存项的创建时间
   * @param key 缓存键
   * @returns 创建时间戳，如果元数据不存在则返回 undefined
   */
  async getCreatedAt(key: string): Promise<number | undefined> {
    const meta = await this.getMeta(key)
    return meta?.createdAt
  }

  /**
   * 获取缓存项的更新时间
   * @param key 缓存键
   * @returns 更新时间戳，如果元数据不存在则返回 undefined
   */
  async getUpdatedAt(key: string): Promise<number | undefined> {
    const meta = await this.getMeta(key)
    return meta?.updatedAt
  }

  /**
   * 获取按创建时间排序的缓存项元数据
   * @param ascending 是否按升序排序（默认为true，即最早创建的在前）
   * @returns 排序后的缓存项元数据数组
   */
  async getSortedByCreatedAt(
    ascending = true,
  ): Promise<CacheMetaItem[]> {
    const items = await this.getAllMeta()

    return items.sort((a, b) => {
      return ascending ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
    })
  }

  /**
   * 获取按更新时间排序的缓存项元数据
   * @param ascending 是否按升序排序（默认为true，即最早更新的在前）
   * @returns 排序后的缓存项元数据数组
   */
  async getSortedByUpdatedAt(
    ascending = true,
  ): Promise<CacheMetaItem[]> {
    const items = await this.getAllMeta()

    return items.sort((a, b) => {
      return ascending ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt
    })
  }

  /**
   * 生成完整的元数据键
   * @param key 原始缓存键
   * @returns 完整的元数据键
   */
  private generateFullKey(key: string): string {
    return `${this.storeName}:${key}`
  }
}
