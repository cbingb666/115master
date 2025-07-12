import type { ActressImageInfo } from '../../types/actress'
import { CacheCore } from './core/index'

const ACTRESS_FACE_CACHE_KEY = 'actress_face_json_cache'

// 定义缓存的数据结构
export interface ActressFaceData {
  imageMap: Array<
    [string, { folder: string, filename: string, timestamp: number }[]]
  >
  timestamp: number
}

class ActressFaceCache extends CacheCore<ActressFaceData | ActressImageInfo> {
  constructor() {
    super({
      storeName: ACTRESS_FACE_CACHE_KEY,
    })
  }

  /**
   * 获取演员头像数据
   */
  async getActressData(): Promise<ActressFaceData | null> {
    const cache = await this.get('actress_data')
    return cache ? (cache.value as ActressFaceData) : null
  }

  /**
   * 保存演员头像数据
   */
  async saveActressData(
    imageMap: Array<
      [string, { folder: string, filename: string, timestamp: number }[]]
    >,
    timestamp: number,
  ): Promise<void> {
    await this.set('actress_data', {
      imageMap,
      timestamp,
    })
  }

  /**
   * 获取上次更新时间
   */
  async getLastUpdateTime(): Promise<number> {
    const data = await this.getActressData()
    return data ? data.timestamp : -1
  }
}

export const actressFaceCache = new ActressFaceCache()
