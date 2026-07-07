import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 图片相关 API
 */
export class ImageApiClient extends BaseApiClient {
  /** 获取图片列表 */
  async getFilesImglist(params: Req.GetFilesImglist): Promise<Drive115Response<Res.GetFilesImglist>> {
    return this.handle<Res.GetFilesImglist>(
      this.fetchRequest.get(
        new URL('/files/imglist', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 获取 Pro 图片列表 */
  async getAndroidFilesImglist(params: Req.AndroidFilesImglist): Promise<Drive115Response<Res.AndroidFilesImglist>> {
    const { tm, encoded } = this.proApiEncodeData(params)
    return this.handle<Res.AndroidFilesImglist>(
      this.fetchRequest.get(
        new URL('/android/files/imglist', URL_115.PRO_API).href,
        {
          params: {
            t: tm,
            data: encoded.data,
          },
        },
      ).then(r => r.json()),
    )
  }

  /** 获取图片 */
  async getFilesImage(params: Req.GetFilesImage): Promise<Drive115Response<Res.GetFilesImage>> {
    return this.handle<Res.GetFilesImage>(
      this.fetchRequest.get(
        new URL('/files/image', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }
}
