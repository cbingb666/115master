import type { MyApi } from '../api/index.ts'
import { MY_URL_115 } from '../constants/urls.ts'
import { normalizeResponse } from '../response.ts'
import { BaseApiClient } from './base.ts'

/**
 * 用户相关 API
 */
export class UserApiClient extends BaseApiClient {
  /** 获取用户信息 */
  async getUserAq(data: MyApi.Req.UserAq = {}) {
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

    return normalizeResponse<MyApi.Res.UserAq>(await response.json())
  }
}
