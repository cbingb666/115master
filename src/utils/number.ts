/**
 * 边界值
 * @param value 值
 * @param min 最小值
 * @param max 最大值
 * @returns 带边界限制的值
 * @example
 * boundary(1, 0, 10) // 1
 * boundary(11, 0, 10) // 10
 * boundary(0, 1, 10) // 1
 * boundary(11, 1, 10) // 10
 */
export function boundary(value: number, min: number, max: number) {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}
