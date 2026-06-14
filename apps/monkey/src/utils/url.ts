import { Url } from '@115master/drive115/clients/video'

export const getXUrl = Url.getXUrl

/**
 * 获取 url 参数
 * @param search window.location.search
 * @returns 参数
 */
export function getUrlParams<T>(search: string): T {
  const params = new URLSearchParams(search)
  return Object.fromEntries(params) as T
}
