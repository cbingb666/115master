import { CacheCore } from './core/index'

const IMAGE_CACHE_KEY = 'image_cache'
class ImageCache extends CacheCore<Blob> {
  constructor() {
    super({
      storeName: IMAGE_CACHE_KEY,
    })
  }
}

export const imageCache = new ImageCache()
