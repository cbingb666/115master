import type { JavInfo } from './jav'
import dayjs from 'dayjs'
import { Jav, JAV_SOURCE } from './jav'

/**
 * MissAV 类
 */
export class MissAV extends Jav {
  source = JAV_SOURCE.MISSAV
  baseUrl = 'https://missav.ws/cn/'
  detailUrl = ''
  searchUrl = ''
  labels: { [k: string]: Element | undefined } = {}

  async getInfoByAvNumber(avNumber: string) {
    const detailUrl = new URL(avNumber, this.baseUrl).href

    if (!detailUrl) {
      throw new Jav.NotFound()
    }
    this.detailUrl = detailUrl
    let avNumberPageResponse = await this.request.get(detailUrl)
    if (avNumberPageResponse.status === 301) {
      const redirectUrl = avNumberPageResponse.headers.get('location')
      if (!redirectUrl) {
        throw new Jav.PageError()
      }
      this.detailUrl = redirectUrl
      avNumberPageResponse = await this.request.get(redirectUrl)
    }
    if (avNumberPageResponse.status === 404) {
      throw new Jav.NotFound()
    }
    if (
      avNumberPageResponse.status !== 200
      && avNumberPageResponse.status !== 302
    ) {
      throw new Jav.PageError()
    }
    return await this.parseInfo(await avNumberPageResponse.text())
  }

  async parseInfoBefore(dom: Document): Promise<Document> {
    const labels = this.getLabels(dom)
    this.labels = labels
    return dom
  }

  getLabels(dom: Document) {
    const headers = dom.querySelectorAll(
      '.space-y-2 > div > span:first-of-type',
    )
    return Object.fromEntries(
      Array.from(headers).map(i => [
        i.textContent?.replace(':', '').trim(),
        i,
      ]),
    )
  }

  parseAvNumber(): JavInfo['avNumber'] {
    const avNumber
      = this.labels['番号']?.nextElementSibling?.textContent?.trim()
    return avNumber ?? undefined
  }

  parseTitle(): JavInfo['title'] {
    const title = this.labels['标题']?.nextElementSibling?.textContent?.trim()
    return title ?? undefined
  }

  parseDate(): JavInfo['date'] {
    const date = this.labels['日期']?.nextElementSibling?.textContent?.trim()
    return date ? dayjs(date.replace(/[^\d-]/g, '')).valueOf() : 0
  }

  parseDuration(): JavInfo['duration'] {
    return undefined
  }

  parseDirector(): JavInfo['director'] {
    const directors = this.labels['导演']?.parentElement?.querySelectorAll('a')
    return directors?.length
      ? Array.from(directors).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parseActor(): JavInfo['actors'] {
    const femaleActors
      = this.labels['女优']?.parentElement?.querySelectorAll('a')
    const maleActors
      = this.labels['男优']?.parentElement?.querySelectorAll('a')
    return [
      ...(femaleActors?.length
        ? Array.from(femaleActors).map(i => ({
            name: i.textContent!,
            url: i.getAttribute('href') ?? undefined,
            sex: 0 as const,
          }))
        : []),
      ...(maleActors?.length
        ? Array.from(maleActors).map(i => ({
            name: i.textContent!,
            url: i.getAttribute('href') ?? undefined,
            sex: 1 as const,
          }))
        : []),
    ]
  }

  parseStudio(): JavInfo['studio'] {
    return undefined
  }

  parsePublisher(): JavInfo['publisher'] {
    const publisher
      = this.labels['发行商']?.parentElement?.querySelectorAll('a')
    return publisher?.length
      ? Array.from(publisher).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parseCover(dom: Document): JavInfo['cover'] {
    const cover = dom
      .querySelector('meta[property=\'og:image\']')
      ?.getAttribute('content')

    return cover
      ? {
          url: cover,
        }
      : undefined
  }

  /** TODO: 单页封面 */
  parseCoverSingle(): JavInfo['coverSingle'] {
    return undefined
  }

  parsePreview(): JavInfo['preview'] {
    return undefined
  }

  parseSeries(): JavInfo['series'] {
    const series = this.labels['标籤']?.parentElement?.querySelectorAll('a')
    return series?.length
      ? Array.from(series)
          .map(i => ({
            name: i.textContent!,
            url: i.getAttribute('href') ?? undefined,
          }))
          .map(i => ({
            ...i,
            url: i.url ? new URL(i.url, this.baseUrl).href : undefined,
          }))
      : undefined
  }

  parseCategory(): JavInfo['category'] {
    const categories = this.labels['类型']?.parentElement?.querySelectorAll('a')
    return categories?.length
      ? Array.from(categories).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parseComments(): JavInfo['comments'] {
    return undefined
  }
}
