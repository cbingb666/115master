/**
 * 模糊时间
 * @param time 时间
 * @param blur 模糊时间
 * @returns 模糊时间
 */
export function blurTime(time: number, blur: number, max: number) {
  const _blurTime = time - (time % blur) + blur / 2
  return Math.max(0, Math.min(_blurTime, max))
}

/**
 * 获取时长
 * @param time 时长
 * @returns 秒
 * @example
 * getDuration("10:00") // 600
 * getDuration("01:00:00") // 3600
 * getDuration("00:01:00") // 60
 * getDuration("00:00:01") // 1
 */
export function getDuration(time?: string) {
  if (!time) {
    return 0
  }
  const [seconds = 0, minutes = 0, hours = 0] = time
    .split(':')
    .map(Number)
    .reverse()
  return hours * 3600 + minutes * 60 + seconds
}
