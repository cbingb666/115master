import { CacheCore } from '@115master/shared'
import { appLogger } from '@/utils/logger'
import { STORE_NAME } from './const'

const IMAGE_CACHE_KEY = 'image_cache'
class ImageCache extends CacheCore<Blob> {
  constructor() {
    super({
      name: STORE_NAME,
      storeName: IMAGE_CACHE_KEY,
      logger: appLogger.sub('ImageCache'),
    })
  }
}

export const imageCache = new ImageCache()
