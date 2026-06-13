import type { IRequest } from '@115master/shared'

/**
 * Drive115Core 依赖配置
 */
export interface Drive115CoreDeps {
  /** Fetch 请求实例 */
  fetchRequest: IRequest
  /** Pro API 请求实例（用于 115 浏览器环境下的下载请求） */
  proApiRequest: IRequest
}
