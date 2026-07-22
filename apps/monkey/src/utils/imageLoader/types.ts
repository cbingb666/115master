export interface ImageResource {
  src: string
  dispose?: () => void
}

/** 图片来源 seam。key 必须随 loader 配置变化，供 Image 精确失效当前请求。 */
export interface ImageLoader {
  key: string
  load: (src: string, signal: AbortSignal) => Promise<ImageResource>
}
