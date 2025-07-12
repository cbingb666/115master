import type { Subtitle } from '../../components/XPlayer/types'
import { CacheCore } from './core'

/** 字幕偏好 Type */
export type SubtitlePreference = Subtitle

/** 字幕偏好存储前缀 */
const STORE_PREFIX = 'subtitle_preference'

/** 字幕偏好管理器 Class */
export class SubtitlePreferenceManager extends CacheCore<SubtitlePreference> {
  /** 构造函数 */
  constructor() {
    super({
      storeName: STORE_PREFIX,
      enableQuotaManagement: false,
    })
  }

  /** 保存字幕偏好 */
  async savePreference(
    pickcode: string,
    subtitle: Subtitle | null,
  ): Promise<void> {
    try {
      const key = this.getStoreKey(pickcode)
      if (subtitle) {
        await this.set(key, subtitle)
      }
      else {
        await this.remove(key)
      }
    }
    catch (error) {
      console.error('保存字幕偏好失败', error)
    }
  }

  /** 获取字幕偏好 */
  async getPreference(pickcode: string): Promise<SubtitlePreference | null> {
    try {
      const key = this.getStoreKey(pickcode)
      const preference = await this.get(key)
      return preference?.value ?? null
    }
    catch {
      return null
    }
  }

  /** 生成存储 key */
  private getStoreKey(videoName: string): string {
    /** 移除文件扩展名和清理文件名 */
    const cleanName = videoName.replace(/\.[^/.]+$/, '').trim()
    return `${STORE_PREFIX}${cleanName}`
  }
}

/** 字幕偏好 */
export const subtitlePreference = new SubtitlePreferenceManager()
