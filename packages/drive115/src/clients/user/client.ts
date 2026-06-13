import type { Req, Res } from './index.ts'
import { normalizeResponse } from '../../core/response.ts'
import { MY_URL_115 } from '../../share/constants/urls.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 用户相关 API
 */
export class UserApiClient extends BaseApiClient {
  /** 获取用户信息 */
  async getUserAq(data: Req.UserAq = {}) {
    const response = await this.fetchRequest.get(
      new URL('/', MY_URL_115).href,
      {
        params: {
          ct: 'ajax',
          ac: 'get_user_aq',
        },
        data,
      },
    )

    return normalizeResponse<Res.UserAq>(await response.json())
  }
}
