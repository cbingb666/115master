/**
 * 延迟 Promise
 * @param ms 延迟时间
 * @returns 延迟 Promise
 */
export function promiseDelay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带超时功能的 Promise
 * @param fn 函数
 * @param timeout 超时时间
 * @returns 结果
 */
export function promiseWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    fn(),
    promiseDelay(timeout).then(() => {
      throw new Error('Timeout')
    }),
  ])
}
