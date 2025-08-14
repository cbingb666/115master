import type { JavInfo } from '@/utils/jav/jav'
import { CacheCore } from '@/utils/cache/core/index'

const PREVIEW_CACHE_KEY = 'jav_cache'
class JavCache extends CacheCore<JavInfo> {
  constructor() {
    super({
      storeName: PREVIEW_CACHE_KEY,
    })
  }
}

export const javCache = new JavCache()
