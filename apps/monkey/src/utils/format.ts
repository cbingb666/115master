import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

function toTimestamp(input?: number | string) {
  if (input === undefined || input === null || input === '')
    return 0

  const value = Number(input)
  if (Number.isFinite(value) && value > 0) {
    if (value < 100000000000)
      return value * 1000
    return value
  }

  const parsed = dayjs(input)
  if (!parsed.isValid())
    return 0
  return parsed.valueOf()
}

/**
 * 格式化时间戳为日期
 * @param input 时间戳（支持秒或毫秒）
 * @returns 格式化后的日期字符串 YYYY-MM-DD HH:mm
 */
export function formatYMDHM(input?: number | string) {
  const timestamp = toTimestamp(input)
  if (!timestamp)
    return ''
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

/**
 * 格式化时间戳为日期
 * @param input 时间戳（支持秒或毫秒）
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDate(input?: number | string) {
  const timestamp = toTimestamp(input)
  if (!timestamp)
    return ''
  return dayjs(timestamp).format('YYYY-MM-DD')
}

/**
 * 格式化时间戳为近期简短时间
 * @param input 时间戳（支持秒或毫秒）
 * @returns 今天显示 HH:mm，昨天显示 昨天 HH:mm，当年显示 MM-DD HH:mm，其它显示 YYYY-MM-DD HH:mm
 */
export function formatRecentYMDHM(input?: number | string) {
  const timestamp = toTimestamp(input)
  if (!timestamp)
    return ''

  const date = dayjs(timestamp)
  const now = dayjs()

  if (date.isSame(now, 'day'))
    return date.format('HH:mm')

  if (date.isSame(now.subtract(1, 'day'), 'day'))
    return `昨天 ${date.format('HH:mm')}`

  if (date.isSame(now, 'year'))
    return date.format('MM-DD HH:mm')

  return date.format('YYYY-MM-DD HH:mm')
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
