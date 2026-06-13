import type { IRequest } from '@115master/shared'
import type { MyApi, NormalApi, ProApi, WebApi } from './api/index.ts'
import type { M3u8Item } from './types.ts'
import { qualityCodeMap } from './constants/index.ts'
import {
  APS_URL_115,
  MY_URL_115,
  NORMAL_URL_115,
  PRO_API_URL_115,
  VOD_URL_115,
  WEB_API_URL_115,
} from './constants/urls.ts'
import { Crypto115 } from './crypto.ts'
import { Drive115Error, Drive115ErrorCode } from './error.ts'
import { getXUrl } from './utils/url.ts'

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
 */
export class Drive115Core {
  /** 加密 */
  protected crypto115 = new Crypto115()
  /** 依赖配置 */
  protected deps: Drive115CoreDeps

  constructor(deps: Drive115CoreDeps) {
    this.deps = deps
  }

  /** 获取原文件地址 (普通下载，有限制下载大小) */
  async webApiFilesDownload(pickcode: string): Promise<DownloadResult> {
    const response = await this.deps.fetchRequest.get(
      new URL(`/files/download?pickcode=${pickcode}`, WEB_API_URL_115).href,
    )

    const res = (await response.json()) as WebApi.Res.FilesDownload

    if (res.errNo === 990001) {
      throw new Drive115Error('登录已过期，请重新登录', Drive115ErrorCode.SessionExpired)
    }

    if (!res.state || !res.file_url) {
      throw new Drive115Error(
        `服务器返回数据格式错误: ${JSON.stringify(res)}`,
        Drive115ErrorCode.DecodeError,
      )
    }

    return {
      url: {
        url: res.file_url,
      },
    }
  }

  /** 获取原文件地址 (Pro 下载，无限制下载大小) */
  async ProPostAppChromeDownurl(
    pickcode: string,
  ): Promise<DownloadResult> {
    const tm = Math.floor(Date.now() / 1000).toString()
    const src = JSON.stringify({ pickcode })
    const encoded = this.crypto115.m115_encode(src, tm)
    const data = `data=${encodeURIComponent(encoded.data)}`

    const response = await this.deps.proApiRequest.post(
      new URL(`/app/chrome/downurl?t=${tm}&c=9999`, PRO_API_URL_115).href,
      {
        body: data,
      },
    )

    const res = (await response.json()) as ProApi.Res.FilesAppChromeDownurl

    if (!res.state) {
      throw new Error(`获取下载地址失败: ${JSON.stringify(res)}`)
    }

    const result = JSON.parse(
      this.crypto115.m115_decode(res.data, encoded.key),
    )
    const downloadInfo = Object.values(result)[0] as DownloadResult

    return downloadInfo
  }

  /** 获取 m3u8 根 url */
  getM3u8Url(pickcode: string): string {
    return new URL(`/api/video/m3u8/${pickcode}.m3u8`, NORMAL_URL_115).href
  }

  /** 解析 m3u8 列表 */
  async getM3u8Info(url: string, pickcode: string): Promise<M3u8Item[]> {
    const response = await this.deps.fetchRequest.get(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const htmlText = await response.text()
    if (!htmlText.startsWith('#')) {
      let res: NormalApi.Res.VideoM3u8 | undefined
      try {
        res = JSON.parse(htmlText) as NormalApi.Res.VideoM3u8
      }
      catch {
        throw new Drive115Error.NotFoundM3u8File()
      }

      if (res && res.state === false) {
        if (res.code === 911) {
          const verifyUrl = new URL(`?pickcode=${pickcode}`, VOD_URL_115).href
          throw new Drive115Error(
            '你已经高频操作了!\n先去通过一下人机验证再回来刷新页面哦~',
            Drive115ErrorCode.CaptchaRequired,
            undefined,
            { verifyUrl },
          )
        }
        throw new Drive115Error(
          `获取m3u8文件失败: ${res.error}`,
          Drive115ErrorCode.Unknown,
        )
      }
    }
    const lines = htmlText.split('\n')
    const m3u8List: M3u8Item[] = []

    htmlText.split('\n').forEach((line, index) => {
      if (line.includes('NAME="')) {
        const extXStreamInf = line.match(/#EXT-X-STREAM-INF/)
        if (extXStreamInf) {
          const name = line.match(/NAME="([^"]*)"/)?.[1] ?? ''
          const url = lines[index + 1]?.trim()
          m3u8List.push({
            name,
            quality:
              qualityCodeMap[name as unknown as keyof typeof qualityCodeMap],
            url: getXUrl(url),
          })
        }
      }
    })

    // 按照 UD HD BD 排序
    m3u8List.sort((a, b) => b.quality - a.quality)
    return m3u8List
  }

  /** 获取文件列表 (以前老旧的文件夹需要使用它来获取) */
  async ApsGetNatsortFiles(params: WebApi.Req.GetFiles) {
    const response = await this.deps.fetchRequest.get(
      new URL('/natsort/files.php', APS_URL_115).href,
      {
        params,
      },
    )
    return (await response.json()) as WebApi.Res.Files
  }

  /** 获取文件列表 */
  async webApiGetFiles(params: WebApi.Req.GetFiles) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.Files
  }

  /** 获取视频文件信息 */
  async webApiGetFilesVideo(params: WebApi.Req.GetFilesVideo) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files/video', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesVideo
  }

  /** 获取播放历史 */
  async webApiGetWebApiFilesHistory(params: WebApi.Req.GetFilesHistory) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files/history', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesHistory
  }

  /** 更新播放历史 */
  async webApiPostWebApiFilesHistory(data: WebApi.Req.PostFilesHistory) {
    const response = await this.deps.fetchRequest.post(
      new URL('/files/history', WEB_API_URL_115).href,
      {
        data,
      },
    )

    return (await response.json()) as WebApi.Res.FilesHistory
  }

  /** 设置文件星标 */
  async webApiPostFilesStar(
    params: WebApi.Req.FilesStar,
  ): Promise<WebApi.Res.FilesStar> {
    const response = await this.deps.fetchRequest.post(
      new URL('/files/star', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesStar
  }

  /** 获取电影字幕 */
  async webApiGetMoviesSubtitle(params: WebApi.Req.GetMoviesSubtitle) {
    const response = await this.deps.fetchRequest.get(
      new URL('/movies/subtitle', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.MoviesSubtitle
  }

  /** 获取文件信息 */
  async webApiGetFilesIndexInfo(params: WebApi.Req.GetFilesIndexInfo = {}) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files/index_info', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.FilesIndexInfo
  }

  /** 设置文件排序 */
  async webApiPostFilesOrder(params: WebApi.Req.PostFilesOrder) {
    const response = await this.deps.fetchRequest.post(
      new URL('/files/order', WEB_API_URL_115).href,
      {
        data: params,
      },
    )
    return (await response.json()) as WebApi.Res.PostFilesOrder
  }

  /** 重命名文件 (批量) */
  async webApiPostFilesBatchRename(params: WebApi.Req.PostFilesBatchRename) {
    const response = await this.deps.fetchRequest.post(
      new URL('/files/batch_rename', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostFilesBatchRename
  }

  /** 添加文件夹 */
  async webApiPostFilesAdd(params: WebApi.Req.PostFilesAdd) {
    const response = await this.deps.fetchRequest.post(
      new URL('/files/add', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostFilesAdd
  }

  /** 删除文件 */
  async webApiPostRbDelete(params: WebApi.Req.PostRbDelete) {
    const response = await this.deps.fetchRequest.post(
      new URL('/rb/delete', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostRbDelete
  }

  /** 移动文件 */
  async webApiPostFilesMove(params: WebApi.Req.PostFilesMove) {
    const response = await this.deps.fetchRequest.post(
      new URL('/files/move', WEB_API_URL_115).href,
      {
        data: params,
      },
    )

    return (await response.json()) as WebApi.Res.PostFilesMove
  }

  /** 获取移动进度 */
  async webApiGetFilesMoveProgress(params: WebApi.Req.GetFilesMoveProgress) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files/move_progress', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.GetFilesMoveProgress
  }

  /** 搜索 */
  async webApiGetFilesSearch(params: WebApi.Req.GetFilesSearch) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files/search', WEB_API_URL_115).href,
      {
        params,
      },
    )

    return (await response.json()) as WebApi.Res.GetFilesSearch
  }

  /** 获取离线空间 */
  async NormalApiGetOfflineSpace(data: NormalApi.Req.OfflineSpace = {}) {
    const response = await this.deps.fetchRequest.get(
      new URL('/web/lixian/space', NORMAL_URL_115).href,
      {
        params: {
          ct: 'lixian',
          ac: 'space',
          _: Date.now(),
        },
        data,
      },
    )
    return (await response.json()) as NormalApi.Res.OfflineSpace
  }

  /** 获取离线配额 */
  async NormalApiGetOfflineGetQuotaPackageInfo(data: NormalApi.Req.OfflineGetQuotaPackageInfo = {}) {
    const response = await this.deps.fetchRequest.get(
      new URL('/web/lixian', NORMAL_URL_115).href,
      {
        params: {
          ct: 'lixian',
          ac: 'get_quota_package_info',
        },
        data,
      },
    )
    return (await response.json()) as NormalApi.Res.OfflineGetQuotaPackageInfo
  }

  /** 添加一组离线任务 */
  async NormalApiPostOfflineAddUrls(data: NormalApi.Req.OfflineAddUrls) {
    const response = await this.deps.fetchRequest.post(
      new URL('/web/lixian/', NORMAL_URL_115).href,
      {
        params: {
          ct: 'lixian',
          ac: 'add_task_urls',
        },
        data,
        credentials: 'include',
      },
    )
    return (await response.json()) as NormalApi.Res.OfflineAddUrls
  }

  /** 获取用户信息 */
  async MyApiGetUserAq(data: MyApi.Req.UserAq = {}) {
    const response = await this.deps.fetchRequest.get(
      new URL('/', MY_URL_115).href,
      {
        params: {
          ct: 'ajax',
          ac: 'get_user_aq',
        },
        data,
      },
    )
    return (await response.json()) as MyApi.Res.UserAq
  }

  /** 获取图片列表 */
  async WebApiGetFilesImglist(params: WebApi.Req.GetFilesImglist) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files/imglist', WEB_API_URL_115).href,
      { params },
    )
    return (await response.json()) as WebApi.Res.GetFilesImglist
  }

  /** 获取图片列表 */
  async ProApiGetAndroidFilesImglist(params: ProApi.Req.AndroidFilesImglist) {
    const { tm, encoded } = this.ProApiEncodeData(params)
    const response = await this.deps.fetchRequest.get(
      new URL('/android/files/imglist', PRO_API_URL_115).href,
      {
        params: {
          t: tm,
          data: encoded.data,
        },
      },
    )
    return (await response.json()) as ProApi.Res.AndroidFilesImglist
  }

  /** 获取图片 */
  async WebApiGetFilesImage(params: WebApi.Req.GetFilesImage) {
    const response = await this.deps.fetchRequest.get(
      new URL('/files/image', WEB_API_URL_115).href,
      { params },
    )

    return (await response.json()) as WebApi.Res.GetFilesImage
  }

  /** 置顶文件 */
  async webApiPostFilesTop(params: WebApi.Req.PostFilesTop) {
    const response = await this.deps.fetchRequest.post(
      new URL('/files/top', WEB_API_URL_115).href,
      {
        data: params,
      },
    )
    return (await response.json()) as WebApi.Res.PostFilesTop
  }

  /** 编码数据 */
  private ProApiEncodeData(data: object) {
    const tm = Math.floor(Date.now() / 1000).toString()
    const src = JSON.stringify(data)
    const encoded = this.crypto115.m115_encode(src, tm)
    const encodedData = `data=${encodeURIComponent(encoded.data)}`
    return {
      tm,
      encoded,
      encodedData,
    }
  }
}
