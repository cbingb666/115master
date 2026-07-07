import type { ILogger, IRequest } from '@115master/shared'
import type { Crypto115 } from './crypto.ts'

/**
 * Drive115Core 依赖配置
 */
export interface Drive115CoreDeps {
  /** Fetch 请求实例 */
  fetchRequest: IRequest
  /** Pro API 请求实例（用于 115 浏览器环境下的下载请求） */
  proApiRequest: IRequest
  /** 日志实例 */
  logger?: ILogger
  /** 加密实例 */
  crypto115: Crypto115
}
