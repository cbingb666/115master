import type { RequestOptions, ResponseType } from './types'
import { merge } from 'lodash'
import { IRequest } from './types'

/** 默认请求选项 */
const DEFAULT_OPTIONS: RequestOptions = {
  /** 缓存策略 */
  cache: 'no-cache',
  /** 凭证 */
  credentials: 'include',
}

/**
 * Fetch 实现的请求类
 */
export class FetchRequest extends IRequest {
  /** 请求选项 */
  options: RequestOptions = {}

  /**
   * 构造函数
   * @param options 请求选项
   */
  constructor(options: RequestOptions = {}) {
    super()
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  }

  /**
   * 发起请求
   */
  async request(
    url: string,
    _options: RequestOptions = {},
  ): Promise<ResponseType> {
    const options = { ...this.options, ..._options }
    const requestUrl = this.processUrl(url, options.params)

    try {
      const response = await fetch(requestUrl, options)
      return response
    }
    catch (error) {
      throw new Error(
        `请求失败: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * GET 请求
   * @param url 请求 URL
   * @param options 请求选项
   * @returns Promise<Response>
   */
  get(url: string, options?: RequestOptions): Promise<ResponseType> {
    return this.request(url, { ...options, method: 'GET' })
  }

  /**
   * POST 请求
   * @param url 请求 URL
   * @param options 请求选项
   * @returns Promise<Response>
   */
  post(url: string, options?: RequestOptions): Promise<ResponseType> {
    /** 处理 data 参数，转换为 body */
    let finalOptions = options ? { ...options } : {}

    if (finalOptions.data) {
      const contentType
        = (finalOptions.headers as Record<string, string>)?.['Content-Type']
          || 'application/x-www-form-urlencoded'

      let body: string | FormData | URLSearchParams

      if (contentType.includes('application/json')) {
        body = JSON.stringify(finalOptions.data)
      }
      else if (contentType.includes('application/x-www-form-urlencoded')) {
        body = new URLSearchParams(finalOptions.data as Record<string, string>)
      }
      else if (contentType.includes('multipart/form-data')) {
        const formData = new FormData()
        Object.entries(finalOptions.data).forEach(([key, value]) => {
          formData.append(key, value as string | Blob)
        })
        body = formData
        // 使用 FormData 时，浏览器会自动设置 Content-Type，所以需要移除手动设置的头
        if (finalOptions.headers) {
          /** 创建一个不包含 Content-Type 的新 headers 对象 */
          const newHeaders: Record<string, string> = {}
          Object.entries(
            finalOptions.headers as Record<string, string>,
          ).forEach(([key, value]) => {
            if (key.toLowerCase() !== 'content-type') {
              newHeaders[key] = value
            }
          })
          finalOptions.headers = newHeaders
        }
      }
      else {
        body = String(finalOptions.data)
      }

      /** 创建新对象而不是使用 delete */
      const { data, ...restOptions } = finalOptions
      finalOptions = {
        ...restOptions,
        body,
      }
    }

    return this.request(
      url,
      merge(
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
        },
        finalOptions,
      ),
    )
  }

  /**
   * 处理 URL 参数
   * @param url 请求 URL
   * @param params 查询参数
   * @returns 处理后的 URL
   */
  private processUrl(
    url: string,
    params?: unknown,
  ): string {
    if (!params)
      return url

    const urlObj = new URL(url)
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value.toString())
    })

    return urlObj.href
  }
}

/** fetchRequest 实例 */
export const fetchRequest = new FetchRequest()
