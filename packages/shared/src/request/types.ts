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

/** 请求接口 */
export abstract class IRequest {
  abstract get(url: string, options?: RequestOptions): Promise<ResponseType>
  abstract post(url: string, options?: RequestOptions): Promise<ResponseType>
  abstract request(
    url: string,
    options?: RequestOptions,
  ): Promise<ResponseType>
}
