import type { Subtitle } from '@/components/XPlayer/types'
import md5 from 'blueimp-md5'
import { subtitleCache } from '@/utils/cache/subtitleCache'
import { convertToUtf8Blob } from '@/utils/encoding'
import { appLogger } from '@/utils/logger'
import { GMRequestInstance } from '@/utils/request/gmRequst'

/**
 * subtitlecat 搜索结果
 */
interface SubtitleSearchResult {
  /** 标题 */
  title: string
  /** 下载地址 */
  href: string
  /** 下载次数 */
  downloads: number
  /** 评论 */
  comment: 1 | -1 | 0
  /** 原始语言 */
  originLanguage: string
  /** 目标语言 */
  targetLanguage: string
}

/**
 * 处理后的字幕
 */
export type ProcessedSubtitle = Required<Pick<Subtitle, 'id' | 'format' | 'raw'>> & {
  /** 标题 */
  title: string
  /** 下载次数 */
  downloads: number
  /** 评论 */
  comment: 1 | -1 | 0
  /** 原始语言 */
  originLanguage: string
  /** 目标语言 */
  targetLanguage: string
  /** 是否是缓存 */
  isCache: boolean
}

/**
 * subtitlecat 字幕类
 */
export class SubtitleCat {
  /** 日志 */
  protected logger = appLogger.sub('SubtitleCat')
  /** 域名 */
  private domain = 'https://subtitlecat.com'
  /** 请求实例 */
  private iRequest = GMRequestInstance

  /** 获取字幕Blob */
  async fetchSubtitleBlob(url: string): Promise<Blob> {
    const response = await this.iRequest.get(url, { responseType: 'arraybuffer' })
    const arrayBuffer = await response.arrayBuffer()
    return await convertToUtf8Blob(arrayBuffer)
  }

  /** 获取字幕 url */
  fetchSubtitleUrl(url: string, language: string): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      this.iRequest
        .get(url)
        .then(async (response) => {
          const parser = new DOMParser()
          const doc = parser.parseFromString(
            await response.text(),
            'text/html',
          )
          const subtitleUrl = doc
            .querySelector(`#download_${language}`)
            ?.getAttribute('href')

          resolve(subtitleUrl || undefined)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /** 获取字幕 */
  async fetchSubtitle(
    keyword: string,
    language: string,
  ): Promise<ProcessedSubtitle[]> {
    /** 首先尝试从缓存获取 */
    const cachedSubtitles = await subtitleCache.getCache(keyword, language)
    if (cachedSubtitles) {
      this.logger.log('从缓存获取字幕成功')
      // 重新生成所有字幕的 blob URL，因为之前的可能已经失效
      return cachedSubtitles.map(subtitle => ({
        ...subtitle,
      }))
    }

    return new Promise((resolve, reject) => {
      this.iRequest
        .get(`${this.domain}/index.php?search=${keyword}`)
        .then(async (response) => {
          try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(
              await response.text(),
              'text/html',
            )
            const rows = Array.from(
              doc.querySelectorAll('.sub-table tbody tr'),
            ).slice(0, 5)

            this.logger.log('fetchSubtitle', `找到${rows.length}个疑似结果`)

            /** 解析搜索结果并过滤 */
            const searchResults = rows
              .map(row => this.parseSubtitleRow(row, language))
              .filter((item) => {
                /** 使用更宽松的匹配条件 */
                const match = item.title
                  .toLowerCase()
                  .includes(keyword.toLowerCase())
                this.logger.log(
                  'fetchSubtitle',
                  `${item.title} ${match ? '匹配' : '不匹配'}`,
                )
                return match
              })

            /** 处理每个字幕项 */
            const processedResults = await Promise.all(
              searchResults.map(async (item) => {
                const result = await this.processSubtitleItem(item)
                this.logger.log(
                  `转换字幕 ${item.title}`,
                  result ? '成功' : '失败',
                )
                return result
              }),
            )

            /** 过滤掉未成功处理的项并排序 */
            const finalResults = this.sortResults(
              processedResults.filter(
                (item): item is ProcessedSubtitle => item !== undefined,
              ),
            )

            // 缓存所有找到的字幕
            if (finalResults.length > 0) {
              await subtitleCache.addCache(
                keyword,
                language,
                finalResults.map(i => ({
                  ...i,
                  isCache: true,
                })),
              )
            }

            this.logger.info(`下载到 ${finalResults.length} 个字幕`)
            console.table(finalResults)

            resolve(finalResults)
          }
          catch (error) {
            this.logger.error('处理过程中出错:', error)
            reject(error)
          }
        })
        .catch((error) => {
          this.logger.error('请求失败:', error)
          reject(error)
        })
    })
  }

  /** 解析字幕行 */
  private parseSubtitleRow(
    row: Element,
    language: string,
  ): SubtitleSearchResult {
    const firstTd = row.querySelector('td:first-child')
    const link = firstTd?.querySelector('a')
    const title = link?.textContent || ''
    const href = link?.getAttribute('href') || ''

    /** 从第一个td提取原始语言 */
    const langMatch = firstTd?.textContent?.match(/translated from (\w+)/)
    const originLanguage = langMatch ? langMatch[1] : ''

    /** 提取评价 */
    const hasThumbsDown
      = row.querySelector('td:nth-child(2) .fa-thumbs-down') !== null
    const hasThumbsUp
      = row.querySelector('td:nth-child(2) .fa-thumbs-up') !== null
    const comment = hasThumbsDown
      ? (-1 as const)
      : hasThumbsUp
        ? (1 as const)
        : (0 as const)

    /** 提取下载次数 */
    const downloadsText
      = row.querySelector('td:nth-child(3)')?.textContent || ''
    const downloadsMatch = downloadsText.match(/\d+/)
    const downloads = downloadsMatch ? parseInt(downloadsMatch[0]) : 0

    return {
      title,
      href,
      downloads,
      comment,
      originLanguage,
      targetLanguage: language,
    }
  }

  /** 处理字幕项 */
  private async processSubtitleItem(
    item: SubtitleSearchResult,
  ): Promise<ProcessedSubtitle | undefined> {
    const url = await this.fetchSubtitleUrl(
      `${this.domain}/${item.href}`,
      item.targetLanguage,
    )
    if (!url)
      return undefined

    const blob = await this.fetchSubtitleBlob(this.domain + url)

    return {
      ...item,
      id: md5(JSON.stringify(item)),
      raw: blob,
      format: 'srt',
      isCache: false,
    } satisfies ProcessedSubtitle
  }

  /** 排序结果 */
  private sortResults(results: ProcessedSubtitle[]): ProcessedSubtitle[] {
    return results.sort((a, b) => {
      if (b.comment !== a.comment) {
        return b.comment - a.comment
      }
      return b.downloads - a.downloads
    })
  }
}

/** subtitlecat 实例 */
export const subtitlecat = new SubtitleCat()
