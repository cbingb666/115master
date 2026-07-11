export type RequestOptions = RequestInit & {
  responseType?:
    | 'text'
    | 'json'
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'stream'
  timeout?: number
  params?: unknown
  cache?: 'force-cache' | 'no-cache'
  cacheTime?: number
  cacheKey?: string
  cacheStatus?: number[]
  data?: unknown
}

export type ResponseType = Response

/** 响应缓存接口 */
export interface IRequestCache {
  get: (url: string, options?: RequestOptions) => Promise<Response | null>
  set: (url: string, response: Response, options?: RequestOptions) => Promise<void>
  remove: (url: string, options?: RequestOptions) => Promise<void>
  clear: () => Promise<void>
}

/** 请求接口 */
export interface IRequest {
  get: (url: string, options?: RequestOptions) => Promise<ResponseType>
  post: (url: string, options?: RequestOptions) => Promise<ResponseType>
  request: (
    url: string,
    options?: RequestOptions,
  ) => Promise<ResponseType>
}
