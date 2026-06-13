import type { Req, Res } from './index.ts'
import { normalizeResponse } from '../../core/response.ts'
import { PRO_API_URL_115, WEB_API_URL_115 } from '../../share/constants/urls.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 图片相关 API
 */
export class ImageApiClient extends BaseApiClient {
  /** 获取图片列表 */
  async getFilesImglist(params: Req.GetFilesImglist) {
    const response = await this.fetchRequest.get(
      new URL('/files/imglist', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<Res.GetFilesImglist>(await response.json())
  }

  /** 获取 Pro 图片列表 */
  async getAndroidFilesImglist(params: Req.AndroidFilesImglist) {
    const { tm, encoded } = this.proApiEncodeData(params)
    const response = await this.fetchRequest.get(
      new URL('/android/files/imglist', PRO_API_URL_115).href,
      {
        params: {
          t: tm,
          data: encoded.data,
        },
      },
    )

    return normalizeResponse<Res.AndroidFilesImglist>(await response.json())
  }

  /** 获取图片 */
  async getFilesImage(params: Req.GetFilesImage) {
    const response = await this.fetchRequest.get(
      new URL('/files/image', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<Res.GetFilesImage>(await response.json())
  }
}
