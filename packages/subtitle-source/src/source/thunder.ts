import type { SubtitleDeps } from '../types.ts'
import md5 from 'blueimp-md5'

/**
 * 迅雷字幕 API 返回的单个字幕项
 */
interface ThunderItem {
  /** 全局内容ID */
  gcid: string
  /** 内容ID */
  cid: string
  url: string
  ext: string
  name: string
  /** 视频时长（毫秒） */
  duration: number
  languages: string[]
  source: number
  score: number
  /** 指纹评分 */
  fingerprintf_score: number
  /** 额外名称（如"网友上传"） */
  extra_name: string
  /** 媒体类型 */
  mt: number
}

/**
 * 迅雷字幕 API 响应
 */
interface ThunderSubtitleResponse {
  code: number
  data: ThunderItem[]
  result: string
}

/**
 * 处理后的迅雷字幕
 */
export interface ProcessedThunder {
  id: string
  raw: Blob
  format: string
  title: string
  extraName: string
  score: number
}

/**
 * 迅雷字幕客户端
 */
export class Thunder {
  private domain = 'https://api-shoulei-ssl.xunlei.com'
  private request: SubtitleDeps['request']

  constructor(deps: SubtitleDeps) {
    this.request = deps.request
  }

  /** 搜索字幕 */
  async fetchSubtitle(keyword: string): Promise<ProcessedThunder[]> {
    if (!keyword)
      return []

    const url = `${this.domain}/oracle/subtitle?name=${encodeURIComponent(keyword)}`
    const response = await this.request.get(url)
    const data: ThunderSubtitleResponse = await response.json()

    if (data.code !== 0 || data.result !== 'ok')
      throw new Error(`Thunder API error: code=${data.code}, result=${data.result}`)

    if (!data.data?.length)
      return []

    const results = await Promise.all(
      data.data.map(async (item) => {
        try {
          return {
            id: md5(item.gcid + item.cid),
            raw: await this.getSubtitleBlob(item.url),
            title: item.name,
            extraName: item.extra_name,
            score: item.score,
            format: item.ext,
          }
        }
        catch {
          return null
        }
      }),
    )

    return results
      .filter((v): v is ProcessedThunder => v !== null)
      .sort((a, b) => b.score - a.score)
  }

  private async getSubtitleBlob(url: string): Promise<Blob> {
    const response = await this.request.get(url)
    return response.blob()
  }
}
