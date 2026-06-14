import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import type { DownloadResult, M3u8Item } from './model.ts'
import { Drive115Error, Drive115ErrorCode } from '../../core/error.ts'
import { normalizeResponse } from '../../core/response.ts'
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
    const response = await this.fetchRequest.get(
      new URL(`/files/download?pickcode=${pickcode}`, URL_115.WEB_API).href,
    )

    const res = normalizeResponse<Res.FilesDownload>(await response.json())

    if (res.code === Drive115ErrorCode.SessionExpired) {
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
  async proPostAppChromeDownurl(
    pickcode: string,
  ): Promise<DownloadResult> {
    const { tm, encoded, encodedData: data } = this.proApiEncodeData({ pickcode })

    const response = await this.proApiRequest.post(
      new URL(`/app/chrome/downurl?t=${tm}&c=9999`, URL_115.PRO_API).href,
      {
        body: data,
      },
    )

    const res = normalizeResponse<Res.FilesAppChromeDownurl>(await response.json())

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
    const response = await this.fetchRequest.get(
      new URL('/files/video', URL_115.WEB_API).href,
      { params },
    )

    return normalizeResponse<Res.FilesVideo>(await response.json())
  }

  /** 获取 m3u8 根 url */
  getM3u8Url(pickcode: string): string {
    return new URL(`/api/video/m3u8/${pickcode}.m3u8`, URL_115.NORMAL).href
  }

  /** 解析 m3u8 列表 */
  async getM3u8Info(url: string, pickcode: string): Promise<M3u8Item[]> {
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

      const normalized = normalizeResponse<Res.VideoM3u8>(res)
      if (normalized.state === false) {
        if (normalized.code === Drive115ErrorCode.CaptchaRequired) {
          const verifyUrl = new URL(`?pickcode=${pickcode}`, URL_115.VOD).href
          throw new Drive115Error(
            '你已经高频操作了!\n先去通过一下人机验证再回来刷新页面哦~',
            Drive115ErrorCode.CaptchaRequired,
            undefined,
            { verifyUrl },
          )
        }
        throw new Drive115Error(
          `获取m3u8文件失败: ${normalized.message}`,
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
    return this.getM3u8Info(url, pickcode)
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
