/**
 * 获取高速 url
 */
export function getXUrl(url: string) {
  if (!url.includes('cpats01')) {
    return url
  }
  return url.replace(/&s=\d+/, `&s=${1024 ** 2 * 50}`)
}

/**
 * 获取 url 参数
 * @param search window.location.search
 * @returns 参数
 */
export function getUrlParams<T>(search: string): T {
  const params = new URLSearchParams(search)
  return Object.fromEntries(params) as T
}
