/**
 * 获取文件扩展名
 */
export function getFileExtensionByUrl(url: string) {
  const pathname = new URL(url).pathname
  return pathname.split('.').pop()
}
