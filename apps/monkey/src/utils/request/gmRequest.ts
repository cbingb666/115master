import { GMRequest } from '@115master/shared'
import { GMRequestCache } from '@/utils/cache/gmRequestCache'

export { GMRequest }

/** 带缓存的 GMRequest 实例 */
export const GMRequestInstance = new GMRequest({}, new GMRequestCache('gm-request-cache'))
