import { GM_notification } from "$";
import localforage from "localforage";
import type { ActressImageInfo, ActressImageMap } from "../types/actress";

export class ActressFaceDB {
	private static readonly CACHE_TIMESTAMP = "actress_images_timestamp";
	private static readonly CACHE_MAP_KEY = "actress_images_map";
	private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 1天的毫秒数
	private static readonly API_URL =
		"https://raw.githubusercontent.com/gfriends/gfriends/refs/heads/master/Filetree.json";

	private storage: LocalForage;
	private imageMap: ActressImageMap;
	private lastUpdateTime = -1;
	private updateTimer: number | null;
	private initPromise: Promise<ActressFaceDB> | null = null;

	constructor() {
		this.imageMap = new Map();
		this.updateTimer = null;
		this.storage = localforage.createInstance({
			name: "115master",
			storeName: "actress_images",
		});
		this.init();
	}

	private inited = false;

	/**
	 * 初始化数据库
	 */
	async init(): Promise<ActressFaceDB> {
		// biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
		const promise = new Promise<ActressFaceDB>(async (resolve) => {
			this.inited = false;
			this.lastUpdateTime =
				(await this.storage.getItem<number>(ActressFaceDB.CACHE_TIMESTAMP)) ??
				-1;
			await this.loadFromCache();
			if (await this.checkUpdate()) {
				await this.updateDB();
			}
			this.inited = true;
			resolve(this);
		});
		this.initPromise = promise;
		await promise;
		return this;
	}

	/**
	 * 从远程更新数据库
	 */
	public async updateDB(): Promise<void> {
		try {
			GM_notification("♻️ 正在更新头像数据库...");
			const response = await fetch(ActressFaceDB.API_URL);
			if (!response.ok) {
				// @ts-ignore
				throw new Error(response.status);
			}
			const data: ActressImageInfo = await response.json();
			await this.processAndSaveData(data);
			GM_notification("✅ 头像数据库更新完成");
		} catch (error) {
			// @ts-ignore
			GM_notification(`❌ 更新头像数据库失败 ${error.message}`);
			console.error("更新头像数据库失败:", error);
			throw error;
		}
	}

	/**
	 * 检查是否需要更新
	 */
	public async checkUpdate(): Promise<boolean> {
		const now = Date.now();
		return now - this.lastUpdateTime >= ActressFaceDB.CACHE_DURATION;
	}

	/**
	 * 查找演员头像信息
	 */
	public async findActress(
		name: string,
	): Promise<
		| { folder: string; filename: string; timestamp: number; url: string }
		| undefined
	> {
		if (!this.inited) {
			await this.initPromise;
		}
		const actress = this.imageMap.get(name.toLowerCase());
		if (!actress) {
			return undefined;
		}
		return {
			...actress,
			url: `https://github.com/gfriends/gfriends/blob/master/Content/${actress.folder}/${actress.filename}?raw=true`,
		};
	}

	/**
	 * 获取所有演员数据
	 */
	public getAllActresses(): ActressImageMap {
		return this.imageMap;
	}

	/**
	 * 销毁实例
	 */
	public destroy(): void {
		if (this.updateTimer) {
			window.clearInterval(this.updateTimer);
			this.updateTimer = null;
		}
	}

	/**
	 * 从缓存加载数据
	 */
	private async loadFromCache(): Promise<boolean> {
		try {
			const [cachedMap, cachedTime] = await Promise.all([
				this.storage.getItem<ActressImageMap>(ActressFaceDB.CACHE_MAP_KEY),
				this.storage.getItem<number>(ActressFaceDB.CACHE_TIMESTAMP),
			]);

			if (cachedMap && cachedTime) {
				const now = Date.now();
				if (now - cachedTime < ActressFaceDB.CACHE_DURATION) {
					this.imageMap = new Map(cachedMap);
					this.lastUpdateTime = cachedTime;
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error("从缓存加载数据失败:", error);
			return false;
		}
	}

	/**
	 * 处理并保存数据
	 */
	private async processAndSaveData(data: ActressImageInfo): Promise<void> {
		const newMap = new Map<
			string,
			{ folder: string; filename: string; timestamp: number }
		>();

		// 处理数据并构建查找映射
		Object.entries(data.Content).forEach(([folder, files]) => {
			Object.entries(files).forEach(([originalName, renamedFile]) => {
				const timestamp = parseInt(renamedFile.split("?t=")[1] || "0", 10);
				const actressName = originalName.replace(".jpg", "");
				newMap.set(actressName.toLowerCase(), {
					folder,
					filename: renamedFile.split("?")[0],
					timestamp,
				});
			});
		});

		// 更新状态
		this.imageMap = newMap;
		this.lastUpdateTime = Date.now();

		// 保存到缓存
		await Promise.all([
			this.storage.setItem(
				ActressFaceDB.CACHE_MAP_KEY,
				Array.from(newMap.entries()),
			),
			this.storage.setItem(ActressFaceDB.CACHE_TIMESTAMP, this.lastUpdateTime),
		]);
	}
}
