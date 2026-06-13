import type { OfflineApi } from '../../api/index.ts'
import { NORMAL_URL_115 } from '../../constants/urls.ts'
import { normalizeResponse } from '../../core/response.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 离线下载相关 API
 */
export class OfflineApiClient extends BaseApiClient {
  /** 获取离线空间 */
  async getOfflineSpace(data: OfflineApi.Req.OfflineSpace = {}) {
    const response = await this.fetchRequest.get(
      new URL('/web/lixian/space', NORMAL_URL_115).href,
      {
        params: {
          ct: 'lixian',
          ac: 'space',
          _: Date.now(),
        },
        data,
      },
    )

    return normalizeResponse<OfflineApi.Res.OfflineSpace>(await response.json())
  }

  /** 获取离线配额 */
  async getOfflineGetQuotaPackageInfo(data: OfflineApi.Req.OfflineGetQuotaPackageInfo = {}) {
    const response = await this.fetchRequest.get(
      new URL('/web/lixian', NORMAL_URL_115).href,
      {
        params: {
          ct: 'lixian',
          ac: 'get_quota_package_info',
        },
        data,
      },
    )

    return normalizeResponse<OfflineApi.Res.OfflineGetQuotaPackageInfo>(await response.json())
  }

  /** 添加一组离线任务 */
  async postOfflineAddUrls(data: OfflineApi.Req.OfflineAddUrls) {
    const response = await this.fetchRequest.post(
      new URL('/web/lixian/', NORMAL_URL_115).href,
      {
        params: {
          ct: 'lixian',
          ac: 'add_task_urls',
        },
        data,
        credentials: 'include',
      },
    )

    return normalizeResponse<OfflineApi.Res.OfflineAddUrls>(await response.json())
  }
}
