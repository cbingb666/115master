/**
 * 填充零
 * @param value 值
 * @returns 填充零后的值
 */
export function fillZero(value: number): string {
  return value.toString().padStart(2, '0')
}

/**
 * 格式化时间
 * @param seconds 秒
 * @returns 格式化后的时间 例如：01:02:03
 */
export function formatTime(seconds: number | undefined): string {
  if (Number.isNaN(seconds) || seconds === undefined) {
    return '--:--'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${hours > 0 ? `${fillZero(hours)}:` : ''}${fillZero(minutes)}:${fillZero(remainingSeconds)}`
}
