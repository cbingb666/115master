import type { ProcessedSubtitle } from '../cache.ts'
import type { SubtitleDeps } from '../types.ts'
import md5 from 'blueimp-md5'

/**
 * subtitlecat 搜索结果
 */
interface SubtitleSearchResult {
  title: string
  /** 下载地址 */
  href: string
  downloads: number
  /** 1=赞, -1=踩, 0=无 */
  comment: 1 | -1 | 0
  originLanguage: string
  targetLanguage: string
}

/**
 * subtitlecat 字幕客户端
 */
export class SubtitleCat {
  private domain = 'https://subtitlecat.com'
  private request: SubtitleDeps['request']

  constructor(deps: SubtitleDeps) {
    this.request = deps.request
  }

  async getSubtitleBlob(url: string): Promise<Blob> {
    const response = await this.request.get(url)
    return response.blob()
  }

  async fetchSubtitleUrl(url: string, language: string): Promise<string | undefined> {
    const response = await this.request.get(url)
    const parser = new DOMParser()
    const doc = parser.parseFromString(
      await response.text(),
      'text/html',
    )
    return doc.querySelector(`#download_${language}`)?.getAttribute('href') || undefined
  }

  /** 搜索并下载字幕 */
  async fetchSubtitle(
    keyword: string,
    language: string,
  ): Promise<ProcessedSubtitle[]> {
    if (!keyword)
      return []

    const response = await this.request.get(`${this.domain}/index.php?search=${keyword}`)
    const parser = new DOMParser()
    const doc = parser.parseFromString(
      await response.text(),
      'text/html',
    )
    const rows = Array.from(
      doc.querySelectorAll('.sub-table tbody tr'),
    ).slice(0, 5)

    const searchResults = rows
      .map(row => this.parseSubtitleRow(row, language))
      .filter(item =>
        item.title.toLowerCase().includes(keyword.toLowerCase()),
      )

    const processedResults = await Promise.all(
      searchResults.map(async item => this.processSubtitleItem(item)),
    )

    const finalResults = this.sortResults(
      processedResults.filter(
        (item): item is ProcessedSubtitle => item !== undefined,
      ),
    )

    return finalResults
  }

  private parseSubtitleRow(
    row: Element,
    language: string,
  ): SubtitleSearchResult {
    const firstTd = row.querySelector('td:first-child')
    const link = firstTd?.querySelector('a')
    const title = link?.textContent || ''
    const href = link?.getAttribute('href') || ''

    const langMatch = firstTd?.textContent?.match(/translated from (\w+)/)
    const originLanguage = langMatch ? langMatch[1] : ''

    const hasThumbsDown
      = row.querySelector('td:nth-child(2) .fa-thumbs-down') !== null
    const hasThumbsUp
      = row.querySelector('td:nth-child(2) .fa-thumbs-up') !== null
    const comment = hasThumbsDown
      ? (-1 as const)
      : hasThumbsUp
        ? (1 as const)
        : (0 as const)

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

  private async processSubtitleItem(
    item: SubtitleSearchResult,
  ): Promise<ProcessedSubtitle | undefined> {
    const url = await this.fetchSubtitleUrl(
      `${this.domain}/${item.href}`,
      item.targetLanguage,
    )
    if (!url)
      return undefined

    const blob = await this.getSubtitleBlob(this.domain + url)

    return {
      ...item,
      id: md5(JSON.stringify(item)),
      raw: blob,
      format: 'srt',
    } satisfies ProcessedSubtitle
  }

  private sortResults(results: ProcessedSubtitle[]): ProcessedSubtitle[] {
    return results.sort((a, b) => {
      if (b.comment !== a.comment) {
        return b.comment - a.comment
      }
      return b.downloads - a.downloads
    })
  }
}
