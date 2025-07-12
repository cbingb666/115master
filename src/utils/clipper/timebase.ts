export interface Rational {
  /** 分子 */
  num: number
  /** 分母 */
  den: number
}

/**
 * 微秒时间基
 */
export const microsecTimebase: Rational = {
  num: 1,
  den: 1000000,
}

/**
 * 毫秒时间基
 */
export const millisecTimebase: Rational = {
  num: 1,
  den: 1000,
}

/**
 * 秒时间基
 */
export const secTimebase: Rational = {
  num: 1,
  den: 1,
}

/**
 * 时间基转换
 * @param value {number} 时间值
 * @param fromTimebase {Rational} 源时间基
 * @param toTimebase {Rational} 目标时间基
 */
export function timebaseConvert(
  value: number,
  fromTimebase: Rational,
  toTimebase: Rational,
): number {
  return (
    (((value * fromTimebase.num) / fromTimebase.den) * toTimebase.den)
    / toTimebase.num
  )
}

/**
 * 微秒转换为毫秒
 * @param microsec 微秒
 * @returns 毫秒
 */
export function microsecToMillisec(microsec: number): number {
  return timebaseConvert(microsec, microsecTimebase, millisecTimebase)
}

/**
 * 毫秒转换为微秒
 * @param millisec 毫秒
 * @returns 微秒
 */
export function millisecToMicrosec(millisec: number): number {
  return timebaseConvert(millisec, millisecTimebase, microsecTimebase)
}
