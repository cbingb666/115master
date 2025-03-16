import localforage from "localforage";
import { STORE_NAME } from "./const";
import { QuotaManager } from "./quotaManager";

type CacheValue<T> = {
	value: T;
	size?: number; // 添加大小属性，用于跟踪缓存项大小
	createdAt: number; // 创建时间戳
	updatedAt: number; // 更新时间戳
};

export class CacheCore<T> {
	storage: LocalForage;
	private quotaManager: QuotaManager;
	private enableQuotaManagement: boolean;
	private name: string;
	private storeName: string;

	constructor(
		options: LocalForageOptions & { enableQuotaManagement?: boolean } = {},
	) {
		const { enableQuotaManagement = true, ...storageOptions } = options;

		// 获取存储配置
		this.name = storageOptions.name || STORE_NAME;
		this.storeName = storageOptions.storeName || "cache";

		this.storage = localforage.createInstance({
			name: this.name,
			storeName: this.storeName,
			version: 1,
			description: "cache",
			driver: localforage.INDEXEDDB,
			...storageOptions,
		});

		this.enableQuotaManagement = enableQuotaManagement;
		this.quotaManager = new QuotaManager(this, this.name, this.storeName);
	}

	/**
	 * 估算数据大小
	 * @param value 需要估算大小的数据
	 * @param key 缓存键（用于日志记录）
	 * @returns 估算的数据大小（字节）或 undefined（如果无法估算）
	 */
	private estimateSize(value: T, key: string): number | undefined {
		try {
			// 处理 Blob 类型
			if (value instanceof Blob) {
				return value.size;
			}

			// 处理 Blob 数组
			if (
				Array.isArray(value) &&
				value.length > 0 &&
				value[0] instanceof Blob
			) {
				// 计算所有 Blob 的总大小
				return value.reduce((total, item) => {
					if (item instanceof Blob) {
						return total + item.size;
					}
					return total;
				}, 0);
			}

			// 处理其他类型：尝试序列化并计算大小
			const valueStr = JSON.stringify(value);
			return new Blob([valueStr]).size;
		} catch (e) {
			// 如果无法序列化或计算大小，则记录警告
			console.warn(`无法估算缓存项 ${key} 的大小:`, e);
			return undefined;
		}
	}

	/**
	 * 获取缓存项
	 * @param key 缓存键
	 * @returns 缓存值
	 */
	public async get(key: string) {
		const cache = await this.storage.getItem<CacheValue<T>>(key);

		// 如果启用了空间限额管理，记录访问时间
		if (cache && this.enableQuotaManagement) {
			await this.quotaManager.recordAccess(key, cache.size);
		}

		return cache;
	}

	/**
	 * 设置缓存项
	 * @param key 缓存键
	 * @param value 缓存值
	 * @returns Promise<void>
	 */
	public async set(key: string, value: T): Promise<void> {
		try {
			// 计算缓存项大小（近似值）
			let size: number | undefined;
			if (this.enableQuotaManagement) {
				size = this.estimateSize(value, key);
			}

			// 获取当前时间戳
			const now = Date.now();

			// 检查是否已存在该缓存项，以确定是创建还是更新
			const existingCache = await this.storage.getItem<CacheValue<T>>(key);

			const cacheValue: CacheValue<T> = {
				value,
				...(size !== undefined ? { size } : {}),
				createdAt: existingCache?.createdAt || now, // 如果是新项目则设置创建时间，否则保留原创建时间
				updatedAt: now, // 更新时间总是当前时间
			};

			await this.storage.setItem(key, cacheValue);

			// 如果启用了空间限额管理，记录访问时间和大小
			if (this.enableQuotaManagement) {
				await this.quotaManager.recordAccess(
					key,
					size,
					cacheValue.createdAt,
					cacheValue.updatedAt,
				);

				// 检查是否需要清理空间
				await this.quotaManager.autoCleanup();
			}
		} catch (error) {
			if (
				error instanceof DOMException &&
				error.name === "QuotaExceededError"
			) {
				console.error("缓存失败: 超出配额");

				// 如果启用了空间限额管理，尝试清理空间后重试
				if (this.enableQuotaManagement) {
					const cleaned = await this.quotaManager.cleanup();
					if (cleaned.length > 0) {
						// 清理成功，重试设置缓存
						await this.set(key, value);
						return;
					}
				}
			} else {
				console.error("缓存失败:", error);
			}
		}
	}

	/**
	 * 删除缓存项
	 * @param key 缓存键
	 */
	public async remove(key: string) {
		await this.storage.removeItem(key);

		// 如果启用了空间限额管理，删除元数据
		if (this.enableQuotaManagement) {
			await this.quotaManager.recordRemoval(key);
		}
	}

	/**
	 * 清空缓存
	 */
	public async clear() {
		await this.storage.clear();

		// 如果启用了空间限额管理，清空元数据
		if (this.enableQuotaManagement) {
			await this.quotaManager.clearAllMeta();
		}
	}

	/**
	 * 获取空间限额管理器
	 * @returns 空间限额管理器实例
	 */
	public getQuotaManager(): QuotaManager {
		return this.quotaManager;
	}

	/**
	 * 获取缓存项的创建时间
	 * @param key 缓存键
	 * @returns 创建时间戳，如果缓存项不存在则返回 undefined
	 */
	public async getCreatedAt(key: string): Promise<number | undefined> {
		const cache = await this.storage.getItem<CacheValue<T>>(key);
		return cache?.createdAt;
	}

	/**
	 * 获取缓存项的更新时间
	 * @param key 缓存键
	 * @returns 更新时间戳，如果缓存项不存在则返回 undefined
	 */
	public async getUpdatedAt(key: string): Promise<number | undefined> {
		const cache = await this.storage.getItem<CacheValue<T>>(key);
		return cache?.updatedAt;
	}

	/**
	 * 获取缓存项的年龄（从创建到现在的时间）
	 * @param key 缓存键
	 * @returns 缓存项年龄（毫秒），如果缓存项不存在则返回 undefined
	 */
	public async getAge(key: string): Promise<number | undefined> {
		const createdAt = await this.getCreatedAt(key);
		if (createdAt === undefined) return undefined;
		return Date.now() - createdAt;
	}

	/**
	 * 获取缓存项的新鲜度（从上次更新到现在的时间）
	 * @param key 缓存键
	 * @returns 缓存项新鲜度（毫秒），如果缓存项不存在则返回 undefined
	 */
	public async getFreshness(key: string): Promise<number | undefined> {
		const updatedAt = await this.getUpdatedAt(key);
		if (updatedAt === undefined) return undefined;
		return Date.now() - updatedAt;
	}
}
