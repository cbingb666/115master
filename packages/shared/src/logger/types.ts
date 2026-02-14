/** 日志级别 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'log' | 'warn' | 'error'

/** 日志方法类型 */
export type LogMethod = (...args: unknown[]) => void

/**
 * 日志接口
 * @description 所有日志实现都应该满足此接口
 */
export interface ILogger {
  trace: LogMethod
  debug: LogMethod
  info: LogMethod
  log: LogMethod
  warn: LogMethod
  error: LogMethod
  /** 创建子日志实例 */
  sub: (...names: string[]) => ILogger
}
