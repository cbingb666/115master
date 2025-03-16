import type { Subtitle } from "../../components/XPlayer/types";
import { CacheCore } from "./core";

// 字幕偏好 id
export type SubtitlePreference = Subtitle;

const STORE_PREFIX = "subtitle_preference";

export class SubtitlePreferenceManager extends CacheCore<SubtitlePreference> {
	constructor() {
		super({
			storeName: STORE_PREFIX,
			enableQuotaManagement: false,
		});
	}

	private getStoreKey(videoName: string): string {
		// 移除文件扩展名和清理文件名
		const cleanName = videoName.replace(/\.[^/.]+$/, "").trim();
		return `${STORE_PREFIX}${cleanName}`;
	}

	async savePreference(
		pickcode: string,
		subtitle: Subtitle | null,
	): Promise<void> {
		try {
			const key = this.getStoreKey(pickcode);
			if (subtitle) {
				await this.set(key, subtitle);
			} else {
				await this.remove(key);
			}
		} catch (error) {
			console.error("保存字幕偏好失败", error);
		}
	}

	async getPreference(pickcode: string): Promise<SubtitlePreference | null> {
		try {
			const key = this.getStoreKey(pickcode);
			const preference = await this.get(key);
			return preference?.value ?? null;
		} catch (error) {
			return null;
		}
	}
}

export const subtitlePreference = new SubtitlePreferenceManager();
