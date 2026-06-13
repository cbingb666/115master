import type { ILogger } from '@115master/shared'
import type { WebApi } from './api/index.ts'
import type { DownloadResult, Drive115CoreDeps } from './core.ts'
import type { M3u8Item } from './types.ts'
import { FileApiClient } from './clients/file.ts'
import { ImageApiClient } from './clients/image.ts'
import { OfflineApiClient } from './clients/offline.ts'
import { UserApiClient } from './clients/user.ts'
import { VideoApiClient } from './clients/video.ts'

/**
 * Drive115 依赖配置
 */
export interface Drive115Deps extends Drive115CoreDeps {
  /** 日志实例 */
  logger?: ILogger
}

/**
 * 115 驱动入口
 */
export class Drive115 {
  /** 文件 API */
  file: FileApiClient
  /** 视频 API */
  video: VideoApiClient
  /** 离线 API */
  offline: OfflineApiClient
  /** 用户 API */
  user: UserApiClient
  /** 图片 API */
  image: ImageApiClient

  private logger?: ILogger

  constructor(deps: Drive115Deps) {
    this.file = new FileApiClient(deps)
    this.video = new VideoApiClient(deps)
    this.offline = new OfflineApiClient(deps)
    this.user = new UserApiClient(deps)
    this.image = new ImageApiClient(deps)
    this.logger = deps.logger?.sub('Drive115')
  }

  /** 获取文件列表 */
  async getFiles(params: WebApi.Req.GetFiles) {
    return this.file.getFilesWithFallback(params)
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
  async getM3u8(pickcode: string): Promise<M3u8Item[]> {
    const url = this.video.getM3u8Url(pickcode)
    return this.video.getM3u8Info(url, pickcode)
  }

  /** 获取下载地址 */
  async getFileDownloadUrl(pickcode: string): Promise<DownloadResult> {
    try {
      return await this.video.ProPostAppChromeDownurl(pickcode)
    }
    catch (error) {
      this.logger?.warn('第一种获取下载链接失败', error)
      return await this.video.webApiFilesDownload(pickcode)
    }
  }
}
