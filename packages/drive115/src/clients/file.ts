import type { WebApi } from '../api/index.ts'
import {
  APS_URL_115,
  WEB_API_URL_115,
} from '../constants/urls.ts'
import { normalizeResponse } from '../response.ts'
import { BaseApiClient } from './base.ts'

/**
 * 文件相关 API
 */
export class FileApiClient extends BaseApiClient {
  /** 获取文件列表，主接口失败时回退到 APS 接口 */
  async getFilesWithFallback(params: WebApi.Req.GetFiles) {
    const primary = normalizeResponse<WebApi.Res.Files>(await this.getFilesRaw(params))
    if (primary.state)
      return primary

    const fallback = normalizeResponse<WebApi.Res.Files>(
      await this.ApsGetNatsortFilesRaw(params, primary.order, primary.is_asc),
    )
    if (fallback.state)
      return fallback

    throw new Error(`获取播放列表失败: ${JSON.stringify(fallback)}`)
  }

  /** 获取文件列表 (以前老旧的文件夹需要使用它来获取) */
  async ApsGetNatsortFiles(params: WebApi.Req.GetFiles) {
    return normalizeResponse<WebApi.Res.Files>(await this.ApsGetNatsortFilesRaw(params))
  }

  /** 获取文件列表 */
  async getFiles(params: WebApi.Req.GetFiles) {
    return normalizeResponse<WebApi.Res.Files>(await this.getFilesRaw(params))
  }

  /** 获取视频文件信息 */
  async getFilesVideo(params: WebApi.Req.GetFilesVideo) {
    const response = await this.fetchRequest.get(
      new URL('/files/video', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<WebApi.Res.FilesVideo>(await response.json())
  }

  /** 获取播放历史 */
  async getFilesHistory(params: WebApi.Req.GetFilesHistory) {
    const response = await this.fetchRequest.get(
      new URL('/files/history', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<WebApi.Res.FilesHistory>(await response.json())
  }

  /** 更新播放历史 */
  async updateFilesHistory(data: WebApi.Req.PostFilesHistory) {
    const response = await this.fetchRequest.post(
      new URL('/files/history', WEB_API_URL_115).href,
      { data },
    )

    return normalizeResponse<WebApi.Res.FilesHistory>(await response.json())
  }

  /** 设置文件星标 */
  async starFiles(params: WebApi.Req.FilesStar): Promise<WebApi.Res.FilesStar> {
    const response = await this.fetchRequest.post(
      new URL('/files/star', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<WebApi.Res.FilesStar>(await response.json())
  }

  /** 获取电影字幕 */
  async getMoviesSubtitle(params: WebApi.Req.GetMoviesSubtitle) {
    const response = await this.fetchRequest.get(
      new URL('/movies/subtitle', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<WebApi.Res.MoviesSubtitle>(await response.json())
  }

  /** 获取文件信息 */
  async getFilesIndexInfo(params: WebApi.Req.GetFilesIndexInfo = {}) {
    const response = await this.fetchRequest.get(
      new URL('/files/index_info', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<WebApi.Res.FilesIndexInfo>(await response.json())
  }

  /** 设置文件排序 */
  async setFilesOrder(params: WebApi.Req.PostFilesOrder) {
    const response = await this.fetchRequest.post(
      new URL('/files/order', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<WebApi.Res.PostFilesOrder>(await response.json())
  }

  /** 重命名文件 (批量) */
  async batchRenameFiles(params: WebApi.Req.PostFilesBatchRename) {
    const response = await this.fetchRequest.post(
      new URL('/files/batch_rename', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<WebApi.Res.PostFilesBatchRename>(await response.json())
  }

  /** 添加文件夹 */
  async addFolder(params: WebApi.Req.PostFilesAdd) {
    const response = await this.fetchRequest.post(
      new URL('/files/add', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<WebApi.Res.PostFilesAdd>(await response.json())
  }

  /** 删除文件 */
  async deleteFiles(params: WebApi.Req.PostRbDelete) {
    const response = await this.fetchRequest.post(
      new URL('/rb/delete', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<WebApi.Res.PostRbDelete>(await response.json())
  }

  /** 移动文件 */
  async moveFiles(params: WebApi.Req.PostFilesMove) {
    const response = await this.fetchRequest.post(
      new URL('/files/move', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<WebApi.Res.PostFilesMove>(await response.json())
  }

  /** 获取移动进度 */
  async getFilesMoveProgress(params: WebApi.Req.GetFilesMoveProgress) {
    const response = await this.fetchRequest.get(
      new URL('/files/move_progress', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<WebApi.Res.GetFilesMoveProgress>(await response.json())
  }

  /** 搜索 */
  async searchFiles(params: WebApi.Req.GetFilesSearch) {
    const response = await this.fetchRequest.get(
      new URL('/files/search', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<WebApi.Res.GetFilesSearch>(await response.json())
  }

  /** 获取图片列表 */
  async getFilesImglist(params: WebApi.Req.GetFilesImglist) {
    const response = await this.fetchRequest.get(
      new URL('/files/imglist', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<WebApi.Res.GetFilesImglist>(await response.json())
  }

  /** 置顶文件 */
  async topFiles(params: WebApi.Req.PostFilesTop) {
    const response = await this.fetchRequest.post(
      new URL('/files/top', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<WebApi.Res.PostFilesTop>(await response.json())
  }

  private async ApsGetNatsortFilesRaw(
    params: WebApi.Req.GetFiles,
    order?: string,
    isAsc?: number,
  ) {
    const response = await this.fetchRequest.get(
      new URL('/natsort/files.php', APS_URL_115).href,
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

  private async getFilesRaw(params: WebApi.Req.GetFiles) {
    const response = await this.fetchRequest.get(
      new URL('/files', WEB_API_URL_115).href,
      { params },
    )
    return response.json()
  }
}
