import type { ImageLoader, ImageResource } from './types'
import { image as imageUtil } from '@115master/utils'
import { imageCache } from '@/utils/cache/imageCache'
import { GMRequest } from '@/utils/request/gmRequest'

interface TransformOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  type?: string
}

interface GMImageLoaderOptions {
  referer: string
  cache?: boolean
  maxAge?: number
  transform?: TransformOptions | false
}

const CACHE_VERSION = 1
const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60 * 1000
const DEFAULT_TRANSFORM: TransformOptions = {
  maxWidth: 720,
  maxHeight: 720,
  quality: 0.8,
  type: 'image/webp',
}
const gm = new GMRequest()

function abort(signal: AbortSignal) {
  if (signal.aborted)
    throw signal.reason ?? new DOMException('请求已取消', 'AbortError')
}

function resource(blob: Blob): ImageResource {
  const src = URL.createObjectURL(blob)
  return {
    src,
    dispose: () => URL.revokeObjectURL(src),
  }
}

export function createGMImageLoader(options: GMImageLoaderOptions): ImageLoader {
  const cache = options.cache ?? true
  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE
  const transform = options.transform === false ? false : { ...DEFAULT_TRANSFORM, ...options.transform }
  const key = JSON.stringify([CACHE_VERSION, options.referer, cache, maxAge, transform])

  return {
    key,
    async load(url, signal) {
      const cacheKey = `gm-image:${JSON.stringify([key, url])}`
      if (cache) {
        const hit = await imageCache.get(cacheKey)
        abort(signal)
        if (hit && Date.now() - hit.updatedAt <= maxAge)
          return resource(hit.value)
        if (hit)
          await imageCache.remove(cacheKey)
      }

      const response = await gm.get(url, {
        headers: options.referer ? { Referer: options.referer } : {},
        responseType: 'blob',
        signal,
      })
      if (!response.ok)
        throw new Error(`图片请求失败: HTTP ${response.status}`)

      const original = await response.blob()
      abort(signal)
      if (original.type && !original.type.startsWith('image/'))
        throw new Error(`图片响应类型无效: ${original.type}`)

      const blob = transform ? await imageUtil.compress(original, transform) : original
      abort(signal)
      if (cache)
        await imageCache.set(cacheKey, blob)
      abort(signal)
      return resource(blob)
    },
  }
}
