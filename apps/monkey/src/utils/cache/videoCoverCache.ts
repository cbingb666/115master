import type { VideoCoverRaw } from '@/hooks/useVideoCover'
import { CacheCore } from '@115master/shared'
import { appLogger } from '@/utils/logger'
import { STORE_NAME } from './const'

type VideoCoverCacheValue = VideoCoverRaw

const VIDEO_COVER_CACHE_KEY = 'video_cover_cache_v1'
class VideoCoverCache extends CacheCore<VideoCoverCacheValue> {
  constructor() {
    super({
      name: STORE_NAME,
      storeName: VIDEO_COVER_CACHE_KEY,
      logger: appLogger.sub('VideoCoverCache'),
    })
  }
}

export const videoCoverCache = new VideoCoverCache()
