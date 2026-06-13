import type { FileApi } from '../../api/index.ts'
import {
  APS_URL_115,
  WEB_API_URL_115,
} from '../../constants/urls.ts'
import { Drive115Error, Drive115ErrorCode } from '../../core/error.ts'
import { normalizeResponse } from '../../core/response.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 文件相关 API
 */
export class FileApiClient extends BaseApiClient {
  /** 获取文件列表，主接口失败时回退到 APS 接口 */
  async getFilesWithFallback(params: FileApi.Req.GetFiles) {
    const primary = normalizeResponse<FileApi.Res.Files>(await this.getFilesRaw(params))
    if (primary.state)
      return primary

    const fallback = normalizeResponse<FileApi.Res.Files>(
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
  async apsGetNatsortFiles(params: FileApi.Req.GetFiles) {
    return normalizeResponse<FileApi.Res.Files>(await this.apsGetNatsortFilesRaw(params))
  }

  /** 获取文件列表 */
  async getFiles(params: FileApi.Req.GetFiles) {
    return normalizeResponse<FileApi.Res.Files>(await this.getFilesRaw(params))
  }

  /** 获取播放历史 */
  async getFilesHistory(params: FileApi.Req.GetFilesHistory) {
    const response = await this.fetchRequest.get(
      new URL('/files/history', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<FileApi.Res.FilesHistory>(await response.json())
  }

  /** 更新播放历史 */
  async updateFilesHistory(data: FileApi.Req.PostFilesHistory) {
    const response = await this.fetchRequest.post(
      new URL('/files/history', WEB_API_URL_115).href,
      { data },
    )

    return normalizeResponse<FileApi.Res.FilesHistory>(await response.json())
  }

  /** 设置文件星标 */
  async starFiles(params: FileApi.Req.FilesStar): Promise<FileApi.Res.FilesStar> {
    const response = await this.fetchRequest.post(
      new URL('/files/star', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<FileApi.Res.FilesStar>(await response.json())
  }

  /** 获取电影字幕 */
  async getMoviesSubtitle(params: FileApi.Req.GetMoviesSubtitle) {
    const response = await this.fetchRequest.get(
      new URL('/movies/subtitle', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<FileApi.Res.MoviesSubtitle>(await response.json())
  }

  /** 获取文件信息 */
  async getFilesIndexInfo(params: FileApi.Req.GetFilesIndexInfo = {}) {
    const response = await this.fetchRequest.get(
      new URL('/files/index_info', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<FileApi.Res.FilesIndexInfo>(await response.json())
  }

  /** 设置文件排序 */
  async setFilesOrder(params: FileApi.Req.PostFilesOrder) {
    const response = await this.fetchRequest.post(
      new URL('/files/order', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<FileApi.Res.PostFilesOrder>(await response.json())
  }

  /** 重命名文件 (批量) */
  async batchRenameFiles(params: FileApi.Req.PostFilesBatchRename) {
    const response = await this.fetchRequest.post(
      new URL('/files/batch_rename', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<FileApi.Res.PostFilesBatchRename>(await response.json())
  }

  /** 添加文件夹 */
  async addFolder(params: FileApi.Req.PostFilesAdd) {
    const response = await this.fetchRequest.post(
      new URL('/files/add', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<FileApi.Res.PostFilesAdd>(await response.json())
  }

  /** 删除文件 */
  async deleteFiles(params: FileApi.Req.PostRbDelete) {
    const response = await this.fetchRequest.post(
      new URL('/rb/delete', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<FileApi.Res.PostRbDelete>(await response.json())
  }

  /** 移动文件 */
  async moveFiles(params: FileApi.Req.PostFilesMove) {
    const response = await this.fetchRequest.post(
      new URL('/files/move', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<FileApi.Res.PostFilesMove>(await response.json())
  }

  /** 获取移动进度 */
  async getFilesMoveProgress(params: FileApi.Req.GetFilesMoveProgress) {
    const response = await this.fetchRequest.get(
      new URL('/files/move_progress', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<FileApi.Res.GetFilesMoveProgress>(await response.json())
  }

  /** 搜索 */
  async searchFiles(params: FileApi.Req.GetFilesSearch) {
    const response = await this.fetchRequest.get(
      new URL('/files/search', WEB_API_URL_115).href,
      { params },
    )

    return normalizeResponse<FileApi.Res.GetFilesSearch>(await response.json())
  }

  /** 置顶文件 */
  async topFiles(params: FileApi.Req.PostFilesTop) {
    const response = await this.fetchRequest.post(
      new URL('/files/top', WEB_API_URL_115).href,
      { data: params },
    )

    return normalizeResponse<FileApi.Res.PostFilesTop>(await response.json())
  }

  private async apsGetNatsortFilesRaw(
    params: FileApi.Req.GetFiles,
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

  private async getFilesRaw(params: FileApi.Req.GetFiles) {
    const response = await this.fetchRequest.get(
      new URL('/files', WEB_API_URL_115).href,
      { params },
    )
    return response.json()
  }
}
