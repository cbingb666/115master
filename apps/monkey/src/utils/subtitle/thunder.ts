import type { Subtitle } from '@/components/XPlayer/types'
import md5 from 'blueimp-md5'
import { convertToUtf8Blob } from '@/utils/encoding'
import { appLogger } from '@/utils/logger'
import { GMRequestInstance } from '@/utils/request/gmRequst'

/**
 * 迅雷字幕 API 返回的单个字幕项
 */
interface ThunderSubtitleItem {
  /** 全局内容ID */
  gcid: string
  /** 内容ID */
  cid: string
  /** 字幕下载地址 */
  url: string
  /** 字幕格式 */
  ext: string
  /** 字幕文件名 */
  name: string
  /** 视频时长（毫秒） */
  duration: number
  /** 语言列表 */
  languages: string[]
  /** 来源 */
  source: number
  /** 评分 */
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
  /** 状态码 */
  code: number
  /** 字幕数据列表 */
  data: ThunderSubtitleItem[]
  /** 结果状态 */
  result: string
}

/**
 * 处理后的迅雷字幕
 */
export type ProcessedThunderSubtitle = Required<Pick<Subtitle, 'id' | 'raw' | 'format'>> & {
  /** 标题 */
  title: string
  /** 额外名称 */
  extraName: string
  /** 评分 */
  score: number
  /** 是否是缓存 */
  isCache: boolean
}

/**
 * 迅雷字幕类
 */
export class ThunderSubtitle {
  /** 日志 */
  protected logger = appLogger.sub('ThunderSubtitle')
  /** API 域名 */
  private domain = 'https://api-shoulei-ssl.xunlei.com'
  /** 请求实例 */
  private iRequest = GMRequestInstance

  /**
   * 搜索字幕
   * @param keyword 搜索关键词（文件名）
   */
  async fetchSubtitle(keyword: string): Promise<ProcessedThunderSubtitle[]> {
    if (!keyword) {
      this.logger.warn('缺少搜索关键词', { keyword })
      return []
    }
    try {
      const url = `${this.domain}/oracle/subtitle?name=${encodeURIComponent(keyword)}`
      const response = await this.iRequest.get(url)
      const data: ThunderSubtitleResponse = await response.json()

      if (data.code !== 0 || data.result !== 'ok' || !data.data?.length) {
        this.logger.info('未找到字幕', { keyword, response: data })
        return []
      }

      this.logger.info(`找到 ${data.data.length} 个字幕，关键词: ${keyword}`)

      /** 处理每个字幕项 */
      const processedResults = await Promise.all(
        data.data.map(async (item: ThunderSubtitleItem): Promise<ProcessedThunderSubtitle | null> => {
          try {
            return {
              id: md5(item.gcid + item.cid),
              raw: await this.getSubtitleBlob(item.url),
              title: item.name,
              extraName: item.extra_name,
              score: item.score,
              format: item.ext,
              isCache: false,
            }
          }
          catch (error) {
            this.logger.error(`Download subtitle failed: ${item.name}`, { item, error })
            return null
          }
        }),
      )

      /** 过滤掉下载失败的字幕，并按评分排序 */
      const finalResults = processedResults
        .filter((item): item is ProcessedThunderSubtitle => item !== null)
        .sort((a, b) => b.score - a.score)

      this.logger.info(`下载到 ${finalResults.length} 个字幕`)
      console.table(finalResults)

      return finalResults
    }
    catch (error) {
      this.logger.error('获取迅雷字幕失败', { error })
      return []
    }
  }

  /**
   * 获取字幕文本内容
   * @param url 字幕下载地址
   */
  private async getSubtitleBlob(url: string): Promise<Blob> {
    const response = await this.iRequest.get(url, { responseType: 'arraybuffer' })
    const arrayBuffer = await response.arrayBuffer()
    return await convertToUtf8Blob(arrayBuffer)
  }
}

/** 迅雷字幕实例 */
export const thunderSubtitle = new ThunderSubtitle()
