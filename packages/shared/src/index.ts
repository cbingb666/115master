/**
 * 115Master Shared Package
 *
 * 这个包包含跨应用共享的工具函数、类型定义和常量
 */

// 日志
export { Logger } from './logger/index.ts'
export type { ILogger, LogEntry, LogLevel, LogMethod } from './logger/index.ts'

// 请求
export { IRequest } from './request/index.ts'
export type { RequestOptions, ResponseType } from './request/index.ts'
