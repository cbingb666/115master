import type { JavInfo } from '@/utils/jav/jav'
import { CacheCore } from '@115master/shared'
import { appLogger } from '@/utils/logger'
import { STORE_NAME } from './const'

const PREVIEW_CACHE_KEY = 'jav_cache'
class JavCache extends CacheCore<JavInfo> {
  constructor() {
    super({
      name: STORE_NAME,
      storeName: PREVIEW_CACHE_KEY,
      logger: appLogger.sub('JavCache'),
    })
  }
}

export const javCache = new JavCache()
