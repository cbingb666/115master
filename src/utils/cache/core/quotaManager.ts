import { CLEANUP_BATCH_SIZE, STORAGE_QUOTA_THRESHOLD } from "./const";
import type { CacheCore } from "./index";
import { MetaStore } from "./metaStore";

/**
 * 存储空间使用情况
 */
export type StorageUsage = {
	usage: number; // 已使用空间（字节）
	quota: number; // 总空间配额（字节）
	usageRatio: number; // 使用率（0-1之间）
};

/**
 * 空间限额管理器
 * 用于监控存储空间使用情况并在需要时清理旧数据
 */
export class QuotaManager {
	private metaStore: MetaStore;
	private cacheInstance: CacheCore<unknown>;

	constructor(
		cacheInstance: CacheCore<unknown>,
		name: string,
		storeName: string,
	) {
		this.cacheInstance = cacheInstance;
		this.metaStore = new MetaStore(name, storeName);
	}

	/**
	 * 获取当前存储空间使用情况
	 * @returns 存储空间使用情况
	 */
	public async getStorageUsage(): Promise<StorageUsage> {
		// 使用 navigator.storage API 获取存储使用情况
		// 注意：此 API 可能不被所有浏览器支持
		if (navigator.storage?.estimate) {
			const estimate = await navigator.storage.estimate();
			const usage = estimate.usage || 0;
			const quota = estimate.quota || 0;
			const usageRatio = quota > 0 ? usage / quota : 0;

			return {
				usage,
				quota,
				usageRatio,
			};
		}

		// 如果 API 不可用，返回默认值
		return {
			usage: 0,
			quota: 0,
			usageRatio: 0,
		};
	}

	/**
	 * 检查是否需要清理存储空间
	 * @returns 是否需要清理
	 */
	public async shouldCleanup(): Promise<boolean> {
		const { usageRatio } = await this.getStorageUsage();
		return usageRatio > STORAGE_QUOTA_THRESHOLD;
	}

	/**
	 * 清理旧数据
	 * @param batchSize 每批清理的数量，默认使用常量定义的值
	 * @returns 已清理的键数组
	 */
	public async cleanup(batchSize = CLEANUP_BATCH_SIZE): Promise<string[]> {
		// 检查是否需要清理
		const needCleanup = await this.shouldCleanup();
		if (!needCleanup) {
			return [];
		}

		// 获取按最后访问时间排序的缓存项（最旧的在前）
		const oldestItems = await this.metaStore.getSortedByLastAccessed(true);

		// 如果没有缓存项，直接返回
		if (oldestItems.length === 0) {
			return [];
		}

		// 取出最旧的 batchSize 个缓存项进行清理
		const itemsToCleanup = oldestItems.slice(0, batchSize);
		const cleanedKeys: string[] = [];

		// 逐个清理缓存项
		for (const item of itemsToCleanup) {
			try {
				// 删除实际的缓存数据
				await this.cacheInstance.remove(item.key);
				// 删除元数据
				await this.metaStore.removeMeta(item.key);
				cleanedKeys.push(item.key);
			} catch (error) {
				console.error(`清理缓存项 ${item.key} 失败:`, error);
			}
		}

		console.log(`已清理 ${cleanedKeys.length} 个旧缓存项`);
		return cleanedKeys;
	}

	/**
	 * 记录缓存项访问
	 * @param key 缓存键
	 * @param size 缓存项大小（可选）
	 * @param createdAt 创建时间（可选）
	 * @param updatedAt 更新时间（可选）
	 */
	public async recordAccess(
		key: string,
		size?: number,
		createdAt?: number,
		updatedAt?: number,
	): Promise<void> {
		await this.metaStore.updateMeta(key, size, createdAt, updatedAt);
	}

	/**
	 * 记录缓存项删除
	 * @param key 缓存键
	 */
	public async recordRemoval(key: string): Promise<void> {
		await this.metaStore.removeMeta(key);
	}

	/**
	 * 清空所有元数据
	 */
	public async clearAllMeta(): Promise<void> {
		await this.metaStore.clear();
	}

	/**
	 * 自动清理
	 * 检查存储空间使用情况，如果超过阈值则进行清理
	 * @returns 是否进行了清理
	 */
	public async autoCleanup(): Promise<boolean> {
		const needCleanup = await this.shouldCleanup();
		if (needCleanup) {
			const cleanedKeys = await this.cleanup();
			return cleanedKeys.length > 0;
		}
		return false;
	}
}
