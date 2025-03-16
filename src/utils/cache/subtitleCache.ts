import { AppLogger } from "../logger";
import type { ProcessedSubtitle } from "../subtitle/subtitlecat";
import { CacheCore } from "./core";
interface SubtitleCacheItem {
	subtitles: ProcessedSubtitle[];
	timestamp: number;
	expiresIn: number;
}

export class SubtitleCache extends CacheCore<SubtitleCacheItem> {
	private logger = new AppLogger("Utils SubtitleCache");
	private readonly CACHE_PREFIX = "115master_subtitle_";
	private readonly DEFAULT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7天过期

	constructor() {
		super({
			storeName: "subtitle_cache",
		});
	}

	// 生成缓存键
	private getCacheKey(keyword: string, language: string): string {
		return `${this.CACHE_PREFIX}${keyword}_${language}`;
	}

	// 获取缓存
	async getCache(
		keyword: string,
		language: string,
	): Promise<ProcessedSubtitle[] | null> {
		try {
			const cacheKey = this.getCacheKey(keyword, language);
			const cacheItem = await super.get(cacheKey);

			if (!cacheItem) {
				this.logger.log("缓存未命中", { keyword, language });
				return null;
			}

			// 检查是否过期
			if (Date.now() - cacheItem.value.timestamp > cacheItem.value.expiresIn) {
				this.logger.log("缓存已过期", { keyword, language });
				await this.remove(cacheKey);
				return null;
			}

			this.logger.log("缓存命中", {
				keyword,
				language,
				count: cacheItem.value.subtitles.length,
				cacheItem: cacheItem.value,
			});
			return cacheItem.value.subtitles;
		} catch (error) {
			this.logger.error("获取缓存失败", error);
			return null;
		}
	}

	async addCache(
		keyword: string,
		language: string,
		subtitles: ProcessedSubtitle[],
		expiresIn: number = this.DEFAULT_EXPIRES_IN,
	): Promise<void> {
		try {
			const cacheKey = this.getCacheKey(keyword, language);
			const cacheItem: SubtitleCacheItem = {
				subtitles,
				timestamp: Date.now(),
				expiresIn,
			};

			await super.set(cacheKey, cacheItem);
			this.logger.log("设置缓存成功", {
				keyword,
				language,
				count: subtitles.length,
			});
		} catch (error) {
			this.logger.error("设置缓存失败", error);
		}
	}

	// 清除所有缓存
	async clear(): Promise<void> {
		try {
			await super.clear();
			this.logger.log("清除所有缓存成功");
		} catch (error) {
			this.logger.error("清除缓存失败", error);
		}
	}
}

export const subtitleCache = new SubtitleCache();
