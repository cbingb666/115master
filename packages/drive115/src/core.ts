import type { IRequest } from '@115master/shared'
import type { MyApi, NormalApi, ProApi, WebApi } from './api/index.ts'
import type { M3u8Item } from './types.ts'
import { FileApiClient } from './clients/file.ts'
import { ImageApiClient } from './clients/image.ts'
import { OfflineApiClient } from './clients/offline.ts'
import { UserApiClient } from './clients/user.ts'
import { VideoApiClient } from './clients/video.ts'

/**
 * Drive115Core 依赖配置
 */
export interface Drive115CoreDeps {
  /** Fetch 请求实例 */
  fetchRequest: IRequest
  /** Pro API 请求实例（用于 115 浏览器环境下的下载请求） */
  proApiRequest: IRequest
}

/**
 * 下载结果
 */
export interface DownloadResult {
  /** URL 信息 */
  url: {
    /** 认证 cookie */
    auth_cookie?: {
      /** 过期时间 */
      expire: string
      /** 名称 */
      name: string
      /** 路径 */
      path: string
      /** 值 */
      value: string
    }
    /** 下载地址 */
    url: string
  }
}

/**
 * 115 驱动核心类
 *
 * @deprecated 按业务域拆分为 FileApiClient / VideoApiClient / OfflineApiClient / UserApiClient / ImageApiClient
 */
export class Drive115Core {
  /** 文件 API */
  protected file: FileApiClient
  /** 视频 API */
  protected video: VideoApiClient
  /** 离线 API */
  protected offline: OfflineApiClient
  /** 用户 API */
  protected user: UserApiClient
  /** 图片 API */
  protected image: ImageApiClient
  /** 依赖配置 */
  protected deps: Drive115CoreDeps

  constructor(deps: Drive115CoreDeps) {
    this.deps = deps
    this.file = new FileApiClient(this.deps)
    this.video = new VideoApiClient(this.deps)
    this.offline = new OfflineApiClient(this.deps)
    this.user = new UserApiClient(this.deps)
    this.image = new ImageApiClient(this.deps)
  }

  /** 获取文件列表 (以前老旧的文件夹需要使用它来获取) */
  async ApsGetNatsortFiles(params: WebApi.Req.GetFiles) {
    return this.file.ApsGetNatsortFiles(params)
  }

  /** 获取文件列表 */
  async webApiGetFiles(params: WebApi.Req.GetFiles) {
    return this.file.getFiles(params)
  }

  /** 获取视频文件信息 */
  async webApiGetFilesVideo(params: WebApi.Req.GetFilesVideo) {
    return this.file.getFilesVideo(params)
  }

  /** 获取播放历史 */
  async webApiGetWebApiFilesHistory(params: WebApi.Req.GetFilesHistory) {
    return this.file.getFilesHistory(params)
  }

  /** 更新播放历史 */
  async webApiPostWebApiFilesHistory(data: WebApi.Req.PostFilesHistory) {
    return this.file.updateFilesHistory(data)
  }

  /** 设置文件星标 */
  async webApiPostFilesStar(params: WebApi.Req.FilesStar): Promise<WebApi.Res.FilesStar> {
    return this.file.starFiles(params)
  }

  /** 获取电影字幕 */
  async webApiGetMoviesSubtitle(params: WebApi.Req.GetMoviesSubtitle) {
    return this.file.getMoviesSubtitle(params)
  }

  /** 获取文件信息 */
  async webApiGetFilesIndexInfo(params: WebApi.Req.GetFilesIndexInfo = {}) {
    return this.file.getFilesIndexInfo(params)
  }

  /** 设置文件排序 */
  async webApiPostFilesOrder(params: WebApi.Req.PostFilesOrder) {
    return this.file.setFilesOrder(params)
  }

  /** 重命名文件 (批量) */
  async webApiPostFilesBatchRename(params: WebApi.Req.PostFilesBatchRename) {
    return this.file.batchRenameFiles(params)
  }

  /** 添加文件夹 */
  async webApiPostFilesAdd(params: WebApi.Req.PostFilesAdd) {
    return this.file.addFolder(params)
  }

  /** 删除文件 */
  async webApiPostRbDelete(params: WebApi.Req.PostRbDelete) {
    return this.file.deleteFiles(params)
  }

  /** 移动文件 */
  async webApiPostFilesMove(params: WebApi.Req.PostFilesMove) {
    return this.file.moveFiles(params)
  }

  /** 获取移动进度 */
  async webApiGetFilesMoveProgress(params: WebApi.Req.GetFilesMoveProgress) {
    return this.file.getFilesMoveProgress(params)
  }

  /** 搜索 */
  async webApiGetFilesSearch(params: WebApi.Req.GetFilesSearch) {
    return this.file.searchFiles(params)
  }

  /** 获取离线空间 */
  async NormalApiGetOfflineSpace(data: NormalApi.Req.OfflineSpace = {}) {
    return this.offline.getOfflineSpace(data)
  }

  /** 获取离线配额 */
  async NormalApiGetOfflineGetQuotaPackageInfo(data: NormalApi.Req.OfflineGetQuotaPackageInfo = {}) {
    return this.offline.getOfflineGetQuotaPackageInfo(data)
  }

  /** 添加一组离线任务 */
  async NormalApiPostOfflineAddUrls(data: NormalApi.Req.OfflineAddUrls) {
    return this.offline.postOfflineAddUrls(data)
  }

  /** 获取用户信息 */
  async MyApiGetUserAq(data: MyApi.Req.UserAq = {}) {
    return this.user.getUserAq(data)
  }

  /** 获取图片列表 */
  async WebApiGetFilesImglist(params: WebApi.Req.GetFilesImglist) {
    return this.image.getFilesImglist(params)
  }

  /** 获取图片列表 */
  async ProApiGetAndroidFilesImglist(params: ProApi.Req.AndroidFilesImglist) {
    return this.image.getAndroidFilesImglist(params)
  }

  /** 获取图片 */
  async WebApiGetFilesImage(params: WebApi.Req.GetFilesImage) {
    return this.image.getFilesImage(params)
  }

  /** 置顶文件 */
  async webApiPostFilesTop(params: WebApi.Req.PostFilesTop) {
    return this.file.topFiles(params)
  }

  /** 获取原文件地址 (普通下载，有限制下载大小) */
  async webApiFilesDownload(pickcode: string): Promise<DownloadResult> {
    return this.video.webApiFilesDownload(pickcode)
  }

  /** 获取原文件地址 (Pro 下载，无限制下载大小) */
  async ProPostAppChromeDownurl(
    pickcode: string,
  ): Promise<DownloadResult> {
    return this.video.ProPostAppChromeDownurl(pickcode)
  }

  /** 获取 m3u8 根 url */
  getM3u8Url(pickcode: string): string {
    return this.video.getM3u8Url(pickcode)
  }

  /** 解析 m3u8 列表 */
  async getM3u8Info(url: string, pickcode: string): Promise<M3u8Item[]> {
    return this.video.getM3u8Info(url, pickcode)
  }
}
