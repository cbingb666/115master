import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import { Drive115Error, Drive115ErrorCode } from '../../core/error.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 文件相关 API
 */
export class FileApiClient extends BaseApiClient {
  /** 获取文件列表，主接口失败时回退到 APS 接口 */
  async getFilesWithFallback(params: Req.GetFiles, signal?: AbortSignal): Promise<Drive115Response<Res.Files>> {
    const primary = await this.handle<Res.Files>(this.getFilesRaw(params, signal))
    if (primary.state)
      return primary
    if (signal?.aborted)
      throw signal.reason ?? new DOMException('请求已取消', 'AbortError')

    const fallback = await this.handle<Res.Files>(
      this.apsGetNatsortFilesRaw(params, primary.order, primary.is_asc, signal),
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
    return this.handle<Res.Files>(this.apsGetNatsortFilesRaw(params))
  }

  /** 获取文件列表 */
  async getFiles(params: Req.GetFiles): Promise<Drive115Response<Res.Files>> {
    return this.handle<Res.Files>(this.getFilesRaw(params))
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
    return this.handle<Res.FilesHistory>(
      this.fetchRequest.get(
        new URL('/files/history', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 更新播放历史 */
  async updateFilesHistory(data: Req.PostFilesHistory): Promise<Drive115Response<Res.FilesHistory>> {
    return this.handle<Res.FilesHistory>(
      this.fetchRequest.post(
        new URL('/files/history', URL_115.WEB_API).href,
        { data },
      ).then(r => r.json()),
    )
  }

  /** 设置文件星标 */
  async starFiles(params: Req.FilesStar): Promise<Drive115Response<Res.FilesStar>> {
    return this.handle<Res.FilesStar>(
      this.fetchRequest.post(
        new URL('/files/star', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 获取电影字幕 */
  async getMoviesSubtitle(params: Req.GetMoviesSubtitle): Promise<Drive115Response<Res.MoviesSubtitle>> {
    return this.handle<Res.MoviesSubtitle>(
      this.fetchRequest.get(
        new URL('/movies/subtitle', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 获取文件信息 */
  async getFilesIndexInfo(params: Req.GetFilesIndexInfo = {}): Promise<Drive115Response<Res.FilesIndexInfo>> {
    return this.handle<Res.FilesIndexInfo>(
      this.fetchRequest.get(
        new URL('/files/index_info', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 设置文件排序 */
  async setFilesOrder(params: Req.PostFilesOrder): Promise<Drive115Response<Res.PostFilesOrder>> {
    return this.handle<Res.PostFilesOrder>(
      this.fetchRequest.post(
        new URL('/files/order', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 重命名文件 (批量) */
  async batchRenameFiles(params: Req.PostFilesBatchRename): Promise<Drive115Response<Res.PostFilesBatchRename>> {
    return this.handle<Res.PostFilesBatchRename>(
      this.fetchRequest.post(
        new URL('/files/batch_rename', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 添加文件夹 */
  async addFolder(params: Req.PostFilesAdd): Promise<Drive115Response<Res.PostFilesAdd>> {
    return this.handle<Res.PostFilesAdd>(
      this.fetchRequest.post(
        new URL('/files/add', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 删除文件 (移入回收站) */
  async deleteFiles(params: Req.PostRbDelete): Promise<Drive115Response<Res.PostRbDelete>> {
    return this.handle<Res.PostRbDelete>(
      this.fetchRequest.post(
        new URL('/rb/delete', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 获取回收站列表 */
  async getRbList(params: Req.GetRbList): Promise<Drive115Response<Res.GetRbList>> {
    return this.handle<Res.GetRbList>(
      this.fetchRequest.get(
        new URL('/rb', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 还原回收站文件 */
  async restoreRbFiles(params: Req.PostRbRevert): Promise<Drive115Response<Res.PostRbRevert>> {
    return this.handle<Res.PostRbRevert>(
      this.fetchRequest.post(
        new URL('/rb/revert', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 彻底删除回收站文件 (需安全密钥) */
  async cleanRbFiles(params: Req.PostRbClean): Promise<Drive115Response<Res.PostRbClean>> {
    return this.handle<Res.PostRbClean>(
      this.fetchRequest.post(
        new URL('/rb/clean', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 清空回收站 (需安全密钥) */
  async cleanAllRbFiles(params: Req.PostRbCleanAll): Promise<Drive115Response<Res.PostRbCleanAll>> {
    return this.handle<Res.PostRbCleanAll>(
      this.fetchRequest.post(
        new URL('/rb/clean', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 获取回收站文件属性 */
  async getRbInfo(params: Req.GetRbInfo): Promise<Drive115Response<Res.GetRbInfo>> {
    return this.handle<Res.GetRbInfo>(
      this.fetchRequest.get(
        new URL('/rb/rb_info', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 移动文件 */
  async moveFiles(params: Req.PostFilesMove): Promise<Drive115Response<Res.PostFilesMove>> {
    return this.handle<Res.PostFilesMove>(
      this.fetchRequest.post(
        new URL('/files/move', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 获取移动进度 */
  async getFilesMoveProgress(params: Req.GetFilesMoveProgress): Promise<Drive115Response<Res.GetFilesMoveProgress>> {
    return this.handle<Res.GetFilesMoveProgress>(
      this.fetchRequest.get(
        new URL('/files/move_progress', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 搜索 */
  async searchFiles(params: Req.GetFilesSearch, signal?: AbortSignal): Promise<Drive115Response<Res.GetFilesSearch>> {
    return this.handle<Res.GetFilesSearch>(
      this.fetchRequest.get(
        new URL('/files/search', URL_115.WEB_API).href,
        { params, signal },
      ).then(r => r.json()),
    )
  }

  /** 置顶文件 */
  async topFiles(params: Req.PostFilesTop): Promise<Drive115Response<Res.PostFilesTop>> {
    return this.handle<Res.PostFilesTop>(
      this.fetchRequest.post(
        new URL('/files/top', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  /** 设置文件评分 (支持批量) */
  async scoreFiles(params: Req.FilesScore): Promise<Drive115Response<Res.FilesScore>> {
    return this.handle<Res.FilesScore>(
      this.fetchRequest.post(
        new URL('/files/score', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()),
    )
  }

  private async apsGetNatsortFilesRaw(
    params: Req.GetFiles,
    order?: string,
    isAsc?: number,
    signal?: AbortSignal,
  ) {
    const response = await this.fetchRequest.get(
      new URL('/natsort/files.php', URL_115.APS).href,
      {
        signal,
        params: {
          ...params,
          ...(order !== undefined && { o: order }),
          ...(isAsc !== undefined && { asc: isAsc }),
        },
      },
    )
    return response.json()
  }

  private async getFilesRaw(params: Req.GetFiles, signal?: AbortSignal) {
    const response = await this.fetchRequest.get(
      new URL('/files', URL_115.WEB_API).href,
      { params, signal },
    )
    return response.json()
  }
}
