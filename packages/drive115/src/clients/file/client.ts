import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import { Drive115Error, Drive115ErrorCode } from '../../core/error.ts'
import { normalizeResponse } from '../../core/response.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 文件相关 API
 */
export class FileApiClient extends BaseApiClient {
  /** 获取文件列表，主接口失败时回退到 APS 接口 */
  async getFilesWithFallback(params: Req.GetFiles): Promise<Drive115Response<Res.Files>> {
    const primary = normalizeResponse<Res.Files>(await this.getFilesRaw(params))
    if (primary.state)
      return primary

    const fallback = normalizeResponse<Res.Files>(
      await this.apsGetNatsortFilesRaw(params, primary.order, primary.is_asc),
    )
    if (fallback.state)
      return fallback

    throw new Drive115Error(
      `获取播放列表失败: ${JSON.stringify(fallback)}`,
      Drive115ErrorCode.Unknown,
    )
  }

  /** 获取文件列表 (以前老旧的文件夹需要使用它来获取) */
  async apsGetNatsortFiles(params: Req.GetFiles): Promise<Drive115Response<Res.Files>> {
    return normalizeResponse<Res.Files>(await this.apsGetNatsortFilesRaw(params))
  }

  /** 获取文件列表 */
  async getFiles(params: Req.GetFiles): Promise<Drive115Response<Res.Files>> {
    return normalizeResponse<Res.Files>(await this.getFilesRaw(params))
  }

  /** 获取播放列表 */
  async getPlaylist(cid: string, offset = 0): Promise<Drive115Response<Res.Files>> {
    const params: Req.GetFiles = {
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

    return this.getFilesWithFallback(params)
  }

  /** 获取播放历史 */
  async getFilesHistory(params: Req.GetFilesHistory): Promise<Drive115Response<Res.FilesHistory>> {
    const response = await this.fetchRequest.get(
      new URL('/files/history', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.FilesHistory>(await response.json())
  }

  /** 更新播放历史 */
  async updateFilesHistory(data: Req.PostFilesHistory): Promise<Drive115Response<Res.FilesHistory>> {
    const response = await this.fetchRequest.post(
      new URL('/files/history', URL_115.WEB_API).href,
      { data },
    )

    return normalizeResponse<Res.FilesHistory>(await response.json())
  }

  /** 设置文件星标 */
  async starFiles(params: Req.FilesStar): Promise<Drive115Response<Res.FilesStar>> {
    const response = await this.fetchRequest.post(
      new URL('/files/star', URL_115.WEB_API).href,
      { data: params },
    )

    return normalizeResponse<Res.FilesStar>(await response.json())
  }

  /** 获取电影字幕 */
  async getMoviesSubtitle(params: Req.GetMoviesSubtitle): Promise<Drive115Response<Res.MoviesSubtitle>> {
    const response = await this.fetchRequest.get(
      new URL('/movies/subtitle', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.MoviesSubtitle>(await response.json())
  }

  /** 获取文件信息 */
  async getFilesIndexInfo(params: Req.GetFilesIndexInfo = {}): Promise<Drive115Response<Res.FilesIndexInfo>> {
    const response = await this.fetchRequest.get(
      new URL('/files/index_info', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.FilesIndexInfo>(await response.json())
  }

  /** 设置文件排序 */
  async setFilesOrder(params: Req.PostFilesOrder): Promise<Drive115Response<Res.PostFilesOrder>> {
    const response = await this.fetchRequest.post(
      new URL('/files/order', URL_115.WEB_API).href,
      { data: params },
    )

    return normalizeResponse<Res.PostFilesOrder>(await response.json())
  }

  /** 重命名文件 (批量) */
  async batchRenameFiles(params: Req.PostFilesBatchRename): Promise<Drive115Response<Res.PostFilesBatchRename>> {
    const response = await this.fetchRequest.post(
      new URL('/files/batch_rename', URL_115.WEB_API).href,
      { data: params },
    )

    return normalizeResponse<Res.PostFilesBatchRename>(await response.json())
  }

  /** 添加文件夹 */
  async addFolder(params: Req.PostFilesAdd): Promise<Drive115Response<Res.PostFilesAdd>> {
    const response = await this.fetchRequest.post(
      new URL('/files/add', URL_115.WEB_API).href,
      { data: params },
    )

    return normalizeResponse<Res.PostFilesAdd>(await response.json())
  }

  /** 删除文件 */
  async deleteFiles(params: Req.PostRbDelete): Promise<Drive115Response<Res.PostRbDelete>> {
    const response = await this.fetchRequest.post(
      new URL('/rb/delete', URL_115.WEB_API).href,
      { data: params },
    )

    return normalizeResponse<Res.PostRbDelete>(await response.json())
  }

  /** 移动文件 */
  async moveFiles(params: Req.PostFilesMove): Promise<Drive115Response<Res.PostFilesMove>> {
    const response = await this.fetchRequest.post(
      new URL('/files/move', URL_115.WEB_API).href,
      { data: params },
    )

    return normalizeResponse<Res.PostFilesMove>(await response.json())
  }

  /** 获取移动进度 */
  async getFilesMoveProgress(params: Req.GetFilesMoveProgress): Promise<Drive115Response<Res.GetFilesMoveProgress>> {
    const response = await this.fetchRequest.get(
      new URL('/files/move_progress', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.GetFilesMoveProgress>(await response.json())
  }

  /** 搜索 */
  async searchFiles(params: Req.GetFilesSearch): Promise<Drive115Response<Res.GetFilesSearch>> {
    const response = await this.fetchRequest.get(
      new URL('/files/search', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.GetFilesSearch>(await response.json())
  }

  /** 置顶文件 */
  async topFiles(params: Req.PostFilesTop): Promise<Drive115Response<Res.PostFilesTop>> {
    const response = await this.fetchRequest.post(
      new URL('/files/top', URL_115.WEB_API).href,
      { data: params },
    )

    return normalizeResponse<Res.PostFilesTop>(await response.json())
  }

  private async apsGetNatsortFilesRaw(
    params: Req.GetFiles,
    order?: string,
    isAsc?: number,
  ) {
    const response = await this.fetchRequest.get(
      new URL('/natsort/files.php', URL_115.APS).href,
      {
        params: {
          ...params,
          ...(order !== undefined && { o: order }),
          ...(isAsc !== undefined && { asc: isAsc }),
        },
      },
    )
    return response.json()
  }

  private async getFilesRaw(params: Req.GetFiles) {
    const response = await this.fetchRequest.get(
      new URL('/files', URL_115.WEB_API).href,
      { params },
    )
    return response.json()
  }
}
