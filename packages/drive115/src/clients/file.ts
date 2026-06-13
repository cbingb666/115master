import type { WebApi } from '../api/index.ts'
import {
  APS_URL_115,
  WEB_API_URL_115,
} from '../constants/urls.ts'
import { BaseApiClient } from './base.ts'

/**
 * 文件相关 API
 */
export class FileApiClient extends BaseApiClient {
  /** 获取文件列表 (以前老旧的文件夹需要使用它来获取) */
  async ApsGetNatsortFiles(params: WebApi.Req.GetFiles) {
    const response = await this.fetchRequest.get(
      new URL('/natsort/files.php', APS_URL_115).href,
      {
        params,
      },
    )
    return (await response.json()) as WebApi.Res.Files
  }

  /** 获取文件列表 */
  async getFiles(params: WebApi.Req.GetFiles) {
    const response = await this.fetchRequest.get(
      new URL('/files', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.Files
  }

  /** 获取视频文件信息 */
  async getFilesVideo(params: WebApi.Req.GetFilesVideo) {
    const response = await this.fetchRequest.get(
      new URL('/files/video', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesVideo
  }

  /** 获取播放历史 */
  async getFilesHistory(params: WebApi.Req.GetFilesHistory) {
    const response = await this.fetchRequest.get(
      new URL('/files/history', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesHistory
  }

  /** 更新播放历史 */
  async updateFilesHistory(data: WebApi.Req.PostFilesHistory) {
    const response = await this.fetchRequest.post(
      new URL('/files/history', WEB_API_URL_115).href,
      {
        data,
      },
    )

    return (await response.json()) as WebApi.Res.FilesHistory
  }

  /** 设置文件星标 */
  async starFiles(params: WebApi.Req.FilesStar): Promise<WebApi.Res.FilesStar> {
    const response = await this.fetchRequest.post(
      new URL('/files/star', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesStar
  }

  /** 获取电影字幕 */
  async getMoviesSubtitle(params: WebApi.Req.GetMoviesSubtitle) {
    const response = await this.fetchRequest.get(
      new URL('/movies/subtitle', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.MoviesSubtitle
  }

  /** 获取文件信息 */
  async getFilesIndexInfo(params: WebApi.Req.GetFilesIndexInfo = {}) {
    const response = await this.fetchRequest.get(
      new URL('/files/index_info', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesIndexInfo
  }

  /** 设置文件排序 */
  async setFilesOrder(params: WebApi.Req.PostFilesOrder) {
    const response = await this.fetchRequest.post(
      new URL('/files/order', WEB_API_URL_115).href,
      {
        data: params,
      },
    )
    return (await response.json()) as WebApi.Res.PostFilesOrder
  }

  /** 重命名文件 (批量) */
  async batchRenameFiles(params: WebApi.Req.PostFilesBatchRename) {
    const response = await this.fetchRequest.post(
      new URL('/files/batch_rename', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostFilesBatchRename
  }

  /** 添加文件夹 */
  async addFolder(params: WebApi.Req.PostFilesAdd) {
    const response = await this.fetchRequest.post(
      new URL('/files/add', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostFilesAdd
  }

  /** 删除文件 */
  async deleteFiles(params: WebApi.Req.PostRbDelete) {
    const response = await this.fetchRequest.post(
      new URL('/rb/delete', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostRbDelete
  }

  /** 移动文件 */
  async moveFiles(params: WebApi.Req.PostFilesMove) {
    const response = await this.fetchRequest.post(
      new URL('/files/move', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostFilesMove
  }

  /** 获取移动进度 */
  async getFilesMoveProgress(params: WebApi.Req.GetFilesMoveProgress) {
    const response = await this.fetchRequest.get(
      new URL('/files/move_progress', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.GetFilesMoveProgress
  }

  /** 搜索 */
  async searchFiles(params: WebApi.Req.GetFilesSearch) {
    const response = await this.fetchRequest.get(
      new URL('/files/search', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.GetFilesSearch
  }

  /** 获取图片列表 */
  async getFilesImglist(params: WebApi.Req.GetFilesImglist) {
    const response = await this.fetchRequest.get(
      new URL('/files/imglist', WEB_API_URL_115).href,
      { params },
    )
    return (await response.json()) as WebApi.Res.GetFilesImglist
  }

  /** 置顶文件 */
  async topFiles(params: WebApi.Req.PostFilesTop) {
    const response = await this.fetchRequest.post(
      new URL('/files/top', WEB_API_URL_115).href,
      {
        data: params,
      },
    )
    return (await response.json()) as WebApi.Res.PostFilesTop
  }
}
