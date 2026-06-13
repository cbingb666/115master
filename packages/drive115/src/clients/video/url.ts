/**
 * 获取高速 url
 */
export function getXUrl(url: string) {
  if (!url.includes('cpats01')) {
    return url
  }
  return url.replace(/&s=\d+/, `&s=${1024 ** 2 * 50}`)
}
