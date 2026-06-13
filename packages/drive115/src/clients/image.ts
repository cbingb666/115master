import type { ProApi, WebApi } from '../api/index.ts'
import { PRO_API_URL_115, WEB_API_URL_115 } from '../constants/urls.ts'
import { BaseApiClient } from './base.ts'

/**
 * 图片相关 API
 */
export class ImageApiClient extends BaseApiClient {
  /** 获取图片列表 */
  async getFilesImglist(params: WebApi.Req.GetFilesImglist) {
    const response = await this.fetchRequest.get(
      new URL('/files/imglist', WEB_API_URL_115).href,
      { params },
    )
    return (await response.json()) as WebApi.Res.GetFilesImglist
  }

  /** 获取图片列表 */
  async getAndroidFilesImglist(params: ProApi.Req.AndroidFilesImglist) {
    const { tm, encoded } = this.ProApiEncodeData(params)
    const response = await this.fetchRequest.get(
      new URL('/android/files/imglist', PRO_API_URL_115).href,
      {
        params: {
          t: tm,
          data: encoded.data,
        },
      },
    )
    return (await response.json()) as ProApi.Res.AndroidFilesImglist
  }

  /** 获取图片 */
  async getFilesImage(params: WebApi.Req.GetFilesImage) {
    const response = await this.fetchRequest.get(
      new URL('/files/image', WEB_API_URL_115).href,
      { params },
    )

    return (await response.json()) as WebApi.Res.GetFilesImage
  }
}
