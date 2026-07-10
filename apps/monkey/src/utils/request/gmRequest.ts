import type { IRequest, IRequestCache, RequestOptions, ResponseType } from '@115master/shared'
import { InfraError } from '@115master/shared'
import { merge } from 'lodash'
import { GM_info, GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client'
import { GMRequestCache } from '@/utils/cache/gmRequestCache'

/** 默认请求选项 */
const DEFAULT_OPTIONS: RequestOptions = {
  cacheStatus: [200],
  cache: 'no-cache',
}

function isChrome() {
  return (
    typeof GM_info !== 'undefined'
    && GM_info.userAgentData.brands.some(brand => brand.brand === 'Google Chrome')
  )
}

/** GM实现 */
export class GMRequest implements IRequest {
  /** 请求选项 */
  options: RequestOptions = {}
  /** 缓存实例 */
  private cache?: IRequestCache

  constructor(options: RequestOptions = {}, cache?: IRequestCache) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
    this.cache = cache
  }

  async request(
    url: string,
    _options: RequestOptions = {},
  ): Promise<ResponseType> {
    const options = { ...this.options, ..._options }
    const urlRe = new URL(url)
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        urlRe.searchParams.set(key, value.toString())
      })
    }

    // 谷歌浏览器才允许修改重定向行为，其他浏览器默认跟随重定向
    /** 否则会造成并发请求中 404 请求，也会导致其他的请求被 canceled */
    const redirect = isChrome() ? options.redirect || 'manual' : 'follow'

    const requestUrl = urlRe.href

    /** 检查是否启用缓存 */
    const useCache = options.cache !== 'no-cache' && this.cache

    // 如果启用缓存，尝试从缓存中获取响应
    if (useCache) {
      const cachedResponse = await this.cache!.get(requestUrl, options)
      if (cachedResponse) {
        return cachedResponse
      }
    }

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: options.method || 'GET',
        url: requestUrl,
        headers: Object.fromEntries(Object.entries(options.headers || {})),
        data: options.body as BodyInit,
        timeout: options.timeout || 5000,
        responseType: options.responseType,
        nocache: !useCache,
        redirect,
        onload: async (rawResponse) => {
          /** 解析响应头 */
          const headers = this.parseResponseHeaders(
            rawResponse.responseHeaders,
          )

          /** 创建Headers对象 */
          const responseHeaders = new Headers()
          Object.entries(headers).forEach(([key, value]) => {
            responseHeaders.append(key, value)
          })

          const response = new Response(rawResponse.response, {
            status: rawResponse.status,
            statusText: rawResponse.statusText,
            headers: responseHeaders,
          })

          // 如果启用缓存，将响应存入缓存
          if (useCache) {
            await this.cache!.set(requestUrl, response.clone(), options)
          }

          resolve(response)
        },
        onerror: (e) => {
          reject(new InfraError('请求失败', requestUrl, undefined, true, e.error))
        },
        ontimeout: () => {
          reject(new InfraError('请求超时', requestUrl, undefined, true))
        },
      })
    })
  }

  get(url: string, options?: RequestOptions): Promise<ResponseType> {
    return this.request(url, { ...options, method: 'GET' })
  }

  post(url: string, options?: RequestOptions): Promise<ResponseType> {
    return this.request(
      url,
      merge(
        {
          method: 'POST',
          body: new URLSearchParams(options?.data as Record<string, string>),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
        },
        options,
      ),
    )
  }

  /**
   * 清除指定 URL 的缓存
   * @param url 请求 URL
   * @param options 请求选项
   */
  async clearCache(
    url: string,
    options?: RequestOptions,
  ): Promise<void> {
    if (!this.cache)
      return
    await this.cache.remove(url, options)
  }

  /**
   * 清除所有缓存
   */
  async clearAllCache(): Promise<void> {
    if (!this.cache)
      return
    await this.cache.clear()
  }

  /**
   * 获取缓存管理器
   * @returns 缓存管理器实例
   */
  getCache(): IRequestCache | undefined {
    return this.cache
  }

  private parseResponseHeaders(headerStr: string): Record<string, string> {
    const headers: Record<string, string> = {}
    if (!headerStr)
      return headers

    const headerPairs = headerStr.split('\n')
    for (let i = 0; i < headerPairs.length; i++) {
      const headerPair = headerPairs[i].trim()
      if (headerPair) {
        const index = headerPair.indexOf(':')
        if (index > 0) {
          const key = headerPair.substring(0, index).trim()
          const val = headerPair.substring(index + 1).trim()
          headers[key.toLowerCase()] = val
        }
      }
    }
    return headers
  }
}

/** 带缓存的 GMRequest 实例 */
export const GMRequestInstance = new GMRequest({}, new GMRequestCache('gm-request-cache'))
