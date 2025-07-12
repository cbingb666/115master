import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

/**
 * 格式化时间戳为日期
 * @param timestamp 时间戳
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDate(timestamp?: number) {
  if (!timestamp)
    return ''
  return dayjs(timestamp).format('YYYY-MM-DD')
}

/**
 * 格式化分钟为时长字符串
 * @param minutes 分钟数
 * @returns 格式化后的时长字符串，例如：2小时 30分钟
 */
export function formatDuration(minutes?: number) {
  if (!minutes)
    return ''
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const parts = []

  if (hours > 0) {
    parts.push(`${hours}小时`)
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes}分钟`)
  }

  return parts.join(' ')
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串，例如：1.23 MB
 */
export function formatFileSize(bytes: number): string {
  if (!bytes)
    return '未知'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}
