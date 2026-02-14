import type { ILogger } from '@115master/shared'
import type { WebApi } from './api/index.ts'
import type { DownloadResult, Drive115CoreDeps } from './core.ts'
import { Drive115Core } from './core.ts'

/** Drive115Wrap 依赖配置 */
export interface Drive115WrapDeps extends Drive115CoreDeps {
  /** 日志实例 */
  logger?: ILogger
}

/** 115驱动的包装 */
export class Drive115Wrap extends Drive115Core {
  /** 日志 */
  protected logger?: ILogger

  constructor(deps: Drive115WrapDeps) {
    super(deps)
    this.logger = deps.logger?.sub('Drive115Wrap')
  }

  /** 获取文件列表 */
  async getFiles(params: WebApi.Req.GetFiles) {
    try {
      const response = await this.webApiGetFiles(params)
      if (response.state) {
        return response
      }
      throw new Error('webapiFiles 获取播放列表失败')
    }
    catch {
      const response = await this.ApsGetNatsortFiles(params)
      if (response.state) {
        return response
      }
      throw new Error(`获取播放列表失败: ${JSON.stringify(response)}`)
    }
  }

  /** 获取播放列表 */
  async getPlaylist(cid: string, offset = 0) {
    const params: WebApi.Req.GetFiles = {
      aid: 1,
      cid,
      offset,
      limit: 1150,
      show_dir: 0,
      nf: '',
      qid: 0,
      type: 4,
      source: '',
      format: 'json',
      is_q: '',
      is_share: '',
      r_all: 1,
      o: 'file_name',
      asc: 1,
      cur: 1,
      natsort: 1,
    }

    return this.getFiles(params)
  }

  /** 获取 m3u8 列表 */
  async getM3u8(pickcode: string) {
    const url = this.getM3u8Url(pickcode)
    const m3u8List = await this.getM3u8Info(url, pickcode)
    return m3u8List
  }

  /** 获取下载地址 */
  async getFileDownloadUrl(pickcode: string): Promise<DownloadResult> {
    try {
      return await this.ProPostAppChromeDownurl(pickcode)
    }
    catch (error) {
      this.logger?.warn('第一种获取下载链接失败', error)
      const res = await this.webApiFilesDownload(pickcode)
      return res
    }
  }
}
