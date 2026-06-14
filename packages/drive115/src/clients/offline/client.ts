import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import { normalizeResponse } from '../../core/response.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 离线下载相关 API
 */
export class OfflineApiClient extends BaseApiClient {
  /** 获取离线空间 */
  async getOfflineSpace(data: Req.OfflineSpace = {}): Promise<Drive115Response<Res.OfflineSpace>> {
    const response = await this.fetchRequest.get(
      new URL('/web/lixian/space', URL_115.NORMAL).href,
      {
        params: {
          ct: 'lixian',
          ac: 'space',
          _: Date.now(),
        },
        data,
      },
    )

    return normalizeResponse<Res.OfflineSpace>(await response.json())
  }

  /** 获取离线配额 */
  async getOfflineGetQuotaPackageInfo(data: Req.OfflineGetQuotaPackageInfo = {}): Promise<Drive115Response<Res.OfflineGetQuotaPackageInfo>> {
    const response = await this.fetchRequest.get(
      new URL('/web/lixian', URL_115.NORMAL).href,
      {
        params: {
          ct: 'lixian',
          ac: 'get_quota_package_info',
        },
        data,
      },
    )

    return normalizeResponse<Res.OfflineGetQuotaPackageInfo>(await response.json())
  }

  /** 添加一组离线任务 */
  async postOfflineAddUrls(data: Req.OfflineAddUrls): Promise<Drive115Response<Res.OfflineAddUrls>> {
    const response = await this.fetchRequest.post(
      new URL('/web/lixian/', URL_115.NORMAL).href,
      {
        params: {
          ct: 'lixian',
          ac: 'add_task_urls',
        },
        data,
        credentials: 'include',
      },
    )

    return normalizeResponse<Res.OfflineAddUrls>(await response.json())
  }
}
