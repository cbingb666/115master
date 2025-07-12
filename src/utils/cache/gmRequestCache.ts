import type { RequestOptions } from '../request/types'
import { CacheCore } from './core'
import { STORE_NAME } from './core/const'

/** 可序列化的响应数据 */
export interface SerializableResponse {
  body: string | ArrayBuffer | null
  status: number
  statusText: string
  headers: Record<string, string>
  url: string
  type: string
  redirected: boolean
  bodyUsed: boolean
}

/** GMRequest 缓存项类型 */
export interface GMRequestCacheItem {
  serializedResponse: SerializableResponse
  timestamp: number
  url: string
}

/**
 * GMRequest 缓存管理器
 * 用于缓存 GMRequest 的请求结果
 */
export class GMRequestCache {
  /** 缓存实例 */
  private cache: CacheCore<GMRequestCacheItem>
  /** 默认缓存时间 */
  private defaultCacheTime: number

  /**
   * 构造函数
   * @param storeName 存储名称，默认为 "gm-request-cache"
   * @param defaultCacheTime 默认缓存时间（毫秒），默认为 1 小时
   */
  constructor(storeName = 'gm-request-cache', defaultCacheTime = 3600000) {
    this.cache = new CacheCore<GMRequestCacheItem>({
      name: STORE_NAME,
      storeName,
      enableQuotaManagement: true,
    })
    this.defaultCacheTime = defaultCacheTime
  }

  /**
   * 获取缓存的响应
   * @param url 请求 URL
   * @param options 请求选项
   * @returns 缓存的响应，如果没有缓存或缓存已过期则返回 null
   */
  async get(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response | null> {
    const key = this.generateCacheKey(url, options)
    const cacheItem = await this.cache.get(key)

    if (!cacheItem) {
      return null
    }

    const { serializedResponse, timestamp } = cacheItem.value
    const cacheTime = options.cacheTime || this.defaultCacheTime

    // 检查缓存是否过期
    if (Date.now() - timestamp > cacheTime) {
      // 缓存已过期，删除并返回 null
      await this.cache.remove(key)
      return null
    }

    // 将序列化的响应转换回 Response 对象
    return this.deserializeResponse(serializedResponse)
  }

  /**
   * 缓存响应
   * @param url 请求 URL
   * @param response 响应对象
   * @param options 请求选项
   */
  async set(
    url: string,
    response: Response,
    options: RequestOptions = {},
  ): Promise<void> {
    /** 只缓存成功的响应 */
    const cacheStatus = options.cacheStatus || [200]
    if (!cacheStatus.includes(response.status)) {
      return
    }

    try {
      const key = this.generateCacheKey(url, options)

      /** 序列化响应 */
      const { serialized } = await this.serializeResponse(response)

      // 存储序列化后的响应
      await this.cache.set(key, {
        serializedResponse: serialized,
        timestamp: Date.now(),
        url,
      })
    }
    catch (error) {
      console.error('缓存响应失败:', error)
    }
  }

  /**
   * 清除指定 URL 的缓存
   * @param url 请求 URL
   * @param options 请求选项
   */
  async remove(
    url: string,
    options: RequestOptions = {},
  ): Promise<void> {
    const key = this.generateCacheKey(url, options)
    await this.cache.remove(key)
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    await this.cache.clear()
  }

  /**
   * 获取缓存管理器
   * @returns 缓存核心实例
   */
  getCacheCore(): CacheCore<GMRequestCacheItem> {
    return this.cache
  }

  /**
   * 生成缓存键
   * @param url 请求 URL
   * @param options 请求选项
   * @returns 缓存键
   */
  private generateCacheKey(url: string, options: RequestOptions = {}): string {
    /** 使用 URL 和请求方法作为基础键 */
    const method = options.method || 'GET'
    let key = `${method}:${url}`

    // 如果有查询参数，添加到键中
    if (options.params) {
      const paramsStr = JSON.stringify(options.params)
      key += `:params:${paramsStr}`
    }

    // 如果有请求体，添加到键中
    if (options.body) {
      try {
        const bodyStr
          = typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body)
        key += `:body:${bodyStr}`
      }
      catch {
        // 如果无法序列化请求体，使用类型信息
        key += `:body:${typeof options.body}`
      }
    }

    return key
  }

  /**
   * 将 Response 对象转换为可序列化的格式
   * @param response Response 对象
   * @returns 序列化后的响应数据和原始响应的 Promise
   */
  private async serializeResponse(
    response: Response,
  ): Promise<{ serialized: SerializableResponse, original: Response }> {
    /** 克隆响应以避免消费原始响应 */
    const clonedResponse = response.clone()

    /** 提取响应头 */
    const headers: Record<string, string> = {}
    clonedResponse.headers.forEach((value, key) => {
      headers[key] = value
    })

    /** 提取响应体 */
    let body: string | ArrayBuffer | null = null

    // 根据响应类型选择合适的方法提取响应体
    if (clonedResponse.bodyUsed) {
      // 如果响应体已被使用，无法再次读取
      body = null
    }
    else {
      try {
        const contentType = clonedResponse.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          // JSON 数据，转换为字符串
          body = await clonedResponse.text()
        }
        else if (
          contentType.includes('text/')
          || contentType.includes('application/javascript')
          || contentType.includes('application/xml')
        ) {
          // 文本数据，转换为字符串
          body = await clonedResponse.text()
        }
        else {
          // 二进制数据，转换为 ArrayBuffer
          body = await clonedResponse.arrayBuffer()
        }
      }
      catch (error) {
        console.error('序列化响应体失败:', error)
        body = null
      }
    }

    /** 创建可序列化的响应对象 */
    const serialized: SerializableResponse = {
      body,
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
      headers,
      url: clonedResponse.url,
      type: clonedResponse.type,
      redirected: clonedResponse.redirected,
      bodyUsed: clonedResponse.bodyUsed,
    }

    return { serialized, original: response }
  }

  /**
   * 将序列化的响应数据转换回 Response 对象
   * @param serialized 序列化的响应数据
   * @returns Response 对象
   */
  private deserializeResponse(serialized: SerializableResponse): Response {
    /** 创建 Headers 对象 */
    const headers = new Headers()
    Object.entries(serialized.headers).forEach(([key, value]) => {
      headers.append(key, value)
    })

    /** 创建响应体 */
    const body = serialized.body

    // 创建 Response 对象
    return new Response(body, {
      status: serialized.status,
      statusText: serialized.statusText,
      headers,
    })
  }
}
