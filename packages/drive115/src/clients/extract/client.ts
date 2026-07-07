import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 解压缩相关 API
 */
export class ExtractApiClient extends BaseApiClient {
  /** 查询解压状态 (GET) */
  async getExtractStatus(pickCode: string): Promise<Drive115Response<Res.PushExtract>> {
    return this.handle<Res.PushExtract>(
      this.fetchRequest.get(
        new URL('/files/push_extract', URL_115.WEB_API).href,
        { params: { pick_code: pickCode } },
      ).then(r => r.json()),
    )
  }

  /** 发起解压 / 提交密码 (POST) */
  async startExtract(params: Req.PushExtract): Promise<Drive115Response<Res.PushExtractPost>> {
    return this.handle<Res.PushExtractPost>(
      this.fetchRequest.post(
        new URL('/files/push_extract', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 浏览解压文件列表 */
  async getExtractInfo(params: Req.ExtractInfo): Promise<Drive115Response<Res.ExtractInfo>> {
    return this.handle<Res.ExtractInfo>(
      this.fetchRequest.get(
        new URL('/files/extract_info', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 保存解压文件到网盘目录 */
  async addExtractFile(params: Req.AddExtractFile): Promise<Drive115Response<Res.AddExtractFile>> {
    return this.handle<Res.AddExtractFile>(
      this.fetchRequest.post(
        new URL('/files/add_extract_file', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 轮询文件保存进度 */
  async getAddExtractProgress(params: Req.AddExtractProgress): Promise<Drive115Response<Res.AddExtractProgress>> {
    return this.handle<Res.AddExtractProgress>(
      this.fetchRequest.get(
        new URL('/files/add_extract_file', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 获取解压后文件夹文件列表（用于下载） */
  async getExtractFolders(params: Req.ExtractFolders): Promise<Drive115Response<Res.ExtractFoldersGet>> {
    return this.handle<Res.ExtractFoldersGet>(
      this.fetchRequest.get(
        new URL('/files/extract_folders', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 验证解压文件数量是否超限 */
  async verifyExtractCount(params: Req.VerifyExtractCount): Promise<Drive115Response<Res.ExtractFoldersVerify>> {
    return this.handle<Res.ExtractFoldersVerify>(
      this.fetchRequest.post(
        new URL('/files/extract_folders', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 获取解压文件下载链接 */
  async getExtractDownFile(params: Req.ExtractDownFile): Promise<Drive115Response<Res.ExtractDownFile>> {
    return this.handle<Res.ExtractDownFile>(
      this.fetchRequest.get(
        new URL('/files/extract_down_file', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }
}
