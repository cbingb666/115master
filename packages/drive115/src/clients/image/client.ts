import type { Req, Res } from './index.ts'
import { normalizeResponse } from '../../core/response.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 图片相关 API
 */
export class ImageApiClient extends BaseApiClient {
  /** 获取图片列表 */
  async getFilesImglist(params: Req.GetFilesImglist) {
    const response = await this.fetchRequest.get(
      new URL('/files/imglist', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.GetFilesImglist>(await response.json())
  }

  /** 获取 Pro 图片列表 */
  async getAndroidFilesImglist(params: Req.AndroidFilesImglist) {
    const { tm, encoded } = this.proApiEncodeData(params)
    const response = await this.fetchRequest.get(
      new URL('/android/files/imglist', URL_115.PRO_API).href,
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
      new URL('/files/image', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.GetFilesImage>(await response.json())
  }
}
