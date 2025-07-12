/**
 * 获取文件扩展名
 */
export function getFileExtensionByUrl(url: string) {
  const newUrl = new URL(url)
  const result = newUrl.pathname.split('.').pop()
  return result
}
