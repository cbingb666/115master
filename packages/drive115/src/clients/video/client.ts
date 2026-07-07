import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import type { DownloadResult, M3u8Item } from './model.ts'
import { Drive115Error, Drive115ErrorCode } from '../../core/error.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'
import { QUALITY_CODE_MAP } from './constant.ts'
import { DownloadResultSchema } from './schema.ts'
import { getXUrl } from './url.ts'

/**
 * 视频相关 API
 */
export class VideoApiClient extends BaseApiClient {
  /** 获取原文件地址 (普通下载，有限制下载大小) */
  async webApiFilesDownload(pickcode: string): Promise<DownloadResult> {
    const res = await this.handle<Res.FilesDownload>(
      this.fetchRequest.get(
        new URL(`/files/download?pickcode=${pickcode}`, URL_115.WEB_API).href,
      ).then(r => r.json()),
    )

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
  async proPostAppChromeDownurl(
    pickcode: string,
  ): Promise<DownloadResult> {
    const { tm, encoded, encodedData: data } = this.proApiEncodeData({ pickcode })

    const res = await this.handle<Res.FilesAppChromeDownurl>(
      this.proApiRequest.post(
        new URL(`/app/chrome/downurl?t=${tm}&c=9999`, URL_115.PRO_API).href,
        {
          body: data,
        },
      ).then(r => r.json()),
    )

    if (!res.state) {
      throw new Drive115Error(`获取下载地址失败: ${JSON.stringify(res)}`, Drive115ErrorCode.Unknown)
    }

    const result = JSON.parse(
      this.crypto115.m115_decode(res.data, encoded.key),
    )
    const entries = Object.values(result)
    const parsed = DownloadResultSchema.safeParse(entries[0])
    if (!parsed.success) {
      throw new Drive115Error(
        'Invalid download response',
        Drive115ErrorCode.DecodeError,
        parsed.error,
      )
    }

    return parsed.data
  }

  /** 获取视频文件信息 */
  async getFilesVideo(params: Req.GetFilesVideo): Promise<Drive115Response<Res.FilesVideo>> {
    return this.handle<Res.FilesVideo>(
      this.fetchRequest.get(
        new URL('/files/video', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()),
    )
  }

  /** 获取 m3u8 根 url */
  getM3u8Url(pickcode: string): string {
    return new URL(`/api/video/m3u8/${pickcode}.m3u8`, URL_115.NORMAL).href
  }

  /** 解析 m3u8 列表 */
  async getM3u8Info(url: string): Promise<M3u8Item[]> {
    const response = await this.fetchRequest.get(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const htmlText = await response.text()
    if (!htmlText.startsWith('#')) {
      let res: Res.VideoM3u8 | undefined
      try {
        res = JSON.parse(htmlText) as Res.VideoM3u8
      }
      catch {
        throw new Drive115Error.NotFoundM3u8File()
      }

      await this.handle<Res.VideoM3u8>(Promise.resolve(res))
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
              QUALITY_CODE_MAP[name as unknown as keyof typeof QUALITY_CODE_MAP],
            url: getXUrl(url),
          })
        }
      }
    })

    // 按照 UD HD BD 排序
    m3u8List.sort((a, b) => b.quality - a.quality)
    return m3u8List
  }

  /** 获取 m3u8 列表 */
  async getM3u8(pickcode: string): Promise<M3u8Item[]> {
    const url = this.getM3u8Url(pickcode)
    return this.getM3u8Info(url)
  }

  /** 获取下载地址 */
  async getFileDownloadUrl(pickcode: string): Promise<DownloadResult> {
    try {
      return await this.proPostAppChromeDownurl(pickcode)
    }
    catch (error) {
      this.deps.logger?.warn('第一种获取下载链接失败', error)
      return await this.webApiFilesDownload(pickcode)
    }
  }
}
