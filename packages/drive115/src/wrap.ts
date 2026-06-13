import type { WebApi } from './api/index.ts'
import type { DownloadResult } from './core.ts'
import type { Drive115Deps } from './drive115.ts'
import type { M3u8Item } from './types.ts'
import { Drive115 } from './drive115.ts'

/**
 * Drive115Wrap 依赖配置
 */
export interface Drive115WrapDeps extends Drive115Deps {}

/**
 * 115驱动的包装
 *
 * @deprecated Use Drive115 instead
 */
export class Drive115Wrap {
  private drive115: Drive115

  constructor(deps: Drive115WrapDeps) {
    this.drive115 = new Drive115(deps)
  }

  /** 获取文件列表 */
  async getFiles(params: WebApi.Req.GetFiles) {
    return this.drive115.file.getFilesWithFallback(params)
  }

  /** 获取播放列表 */
  async getPlaylist(cid: string, offset = 0) {
    return this.drive115.getPlaylist(cid, offset)
  }

  /** 获取 m3u8 列表 */
  async getM3u8(pickcode: string): Promise<M3u8Item[]> {
    return this.drive115.getM3u8(pickcode)
  }

  /** 获取下载地址 */
  async getFileDownloadUrl(pickcode: string): Promise<DownloadResult> {
    return this.drive115.getFileDownloadUrl(pickcode)
  }

  /** 获取文件列表 (以前老旧的文件夹需要使用它来获取) */
  async ApsGetNatsortFiles(params: WebApi.Req.GetFiles) {
    return this.drive115.file.ApsGetNatsortFiles(params)
  }

  /** 获取文件列表 */
  async webApiGetFiles(params: WebApi.Req.GetFiles) {
    return this.drive115.file.getFiles(params)
  }

  /** 获取视频文件信息 */
  async webApiGetFilesVideo(params: WebApi.Req.GetFilesVideo) {
    return this.drive115.file.getFilesVideo(params)
  }

  /** 获取播放历史 */
  async webApiGetWebApiFilesHistory(params: WebApi.Req.GetFilesHistory) {
    return this.drive115.file.getFilesHistory(params)
  }

  /** 更新播放历史 */
  async webApiPostWebApiFilesHistory(data: WebApi.Req.PostFilesHistory) {
    return this.drive115.file.updateFilesHistory(data)
  }

  /** 设置文件星标 */
  async webApiPostFilesStar(params: WebApi.Req.FilesStar): Promise<WebApi.Res.FilesStar> {
    return this.drive115.file.starFiles(params)
  }

  /** 获取电影字幕 */
  async webApiGetMoviesSubtitle(params: WebApi.Req.GetMoviesSubtitle) {
    return this.drive115.file.getMoviesSubtitle(params)
  }

  /** 获取文件信息 */
  async webApiGetFilesIndexInfo(params: WebApi.Req.GetFilesIndexInfo = {}) {
    return this.drive115.file.getFilesIndexInfo(params)
  }

  /** 设置文件排序 */
  async webApiPostFilesOrder(params: WebApi.Req.PostFilesOrder) {
    return this.drive115.file.setFilesOrder(params)
  }

  /** 重命名文件 (批量) */
  async webApiPostFilesBatchRename(params: WebApi.Req.PostFilesBatchRename) {
    return this.drive115.file.batchRenameFiles(params)
  }

  /** 添加文件夹 */
  async webApiPostFilesAdd(params: WebApi.Req.PostFilesAdd) {
    return this.drive115.file.addFolder(params)
  }

  /** 删除文件 */
  async webApiPostRbDelete(params: WebApi.Req.PostRbDelete) {
    return this.drive115.file.deleteFiles(params)
  }

  /** 移动文件 */
  async webApiPostFilesMove(params: WebApi.Req.PostFilesMove) {
    return this.drive115.file.moveFiles(params)
  }

  /** 获取移动进度 */
  async webApiGetFilesMoveProgress(params: WebApi.Req.GetFilesMoveProgress) {
    return this.drive115.file.getFilesMoveProgress(params)
  }

  /** 搜索 */
  async webApiGetFilesSearch(params: WebApi.Req.GetFilesSearch) {
    return this.drive115.file.searchFiles(params)
  }

  /** 获取离线空间 */
  async NormalApiGetOfflineSpace(data: import('./api/index.ts').NormalApi.Req.OfflineSpace = {}) {
    return this.drive115.offline.getOfflineSpace(data)
  }

  /** 获取离线配额 */
  async NormalApiGetOfflineGetQuotaPackageInfo(data: import('./api/index.ts').NormalApi.Req.OfflineGetQuotaPackageInfo = {}) {
    return this.drive115.offline.getOfflineGetQuotaPackageInfo(data)
  }

  /** 添加一组离线任务 */
  async NormalApiPostOfflineAddUrls(data: import('./api/index.ts').NormalApi.Req.OfflineAddUrls) {
    return this.drive115.offline.postOfflineAddUrls(data)
  }

  /** 获取用户信息 */
  async MyApiGetUserAq(data: import('./api/index.ts').MyApi.Req.UserAq = {}) {
    return this.drive115.user.getUserAq(data)
  }

  /** 获取图片列表 */
  async WebApiGetFilesImglist(params: WebApi.Req.GetFilesImglist) {
    return this.drive115.image.getFilesImglist(params)
  }

  /** 获取图片列表 */
  async ProApiGetAndroidFilesImglist(params: import('./api/index.ts').ProApi.Req.AndroidFilesImglist) {
    return this.drive115.image.getAndroidFilesImglist(params)
  }

  /** 获取图片 */
  async WebApiGetFilesImage(params: WebApi.Req.GetFilesImage) {
    return this.drive115.image.getFilesImage(params)
  }

  /** 置顶文件 */
  async webApiPostFilesTop(params: WebApi.Req.PostFilesTop) {
    return this.drive115.file.topFiles(params)
  }

  /** 获取原文件地址 (普通下载，有限制下载大小) */
  async webApiFilesDownload(pickcode: string): Promise<DownloadResult> {
    return this.drive115.video.webApiFilesDownload(pickcode)
  }

  /** 获取原文件地址 (Pro 下载，无限制下载大小) */
  async ProPostAppChromeDownurl(pickcode: string): Promise<DownloadResult> {
    return this.drive115.video.ProPostAppChromeDownurl(pickcode)
  }

  /** 获取 m3u8 根 url */
  getM3u8Url(pickcode: string): string {
    return this.drive115.video.getM3u8Url(pickcode)
  }

  /** 解析 m3u8 列表 */
  async getM3u8Info(url: string, pickcode: string): Promise<M3u8Item[]> {
    return this.drive115.video.getM3u8Info(url, pickcode)
  }
}
