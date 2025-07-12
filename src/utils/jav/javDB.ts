import type { JavInfo } from './jav'
import dayjs from 'dayjs'
import { Jav, JAV_SOURCE } from './jav'

/**
 * JavDB 类
 */
export class JavDB extends Jav {
  source = JAV_SOURCE.JAVDB
  baseUrl = 'https://javdb.com'
  detailUrl = ''
  searchUrl = ''
  labels: { [k: string]: Element | undefined } = {}

  async getInfoByAvNumber(avNumber: string) {
    const params = new URLSearchParams({
      q: avNumber,
    })
    const searchUrl = new URL(`/search?${params.toString()}`, this.baseUrl)
      .href
    this.searchUrl = searchUrl
    const html = await this.request.get(searchUrl)
    if (html.status === 404) {
      throw new Jav.NotFound()
    }
    if (html.status !== 200 && html.status !== 302) {
      throw new Jav.PageError()
    }

    const detailUrl = this.getDetailUrl(await html.text())
    if (!detailUrl) {
      throw new Jav.PageError()
    }
    this.detailUrl = detailUrl
    const avNumberPageResponse = await this.request.get(detailUrl)

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

  getDetailUrl(html: string) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const page = dom.querySelector('.movie-list .item a')?.getAttribute('href')
    return page ? new URL(page, this.baseUrl).href : undefined
  }

  async parseInfoBefore(dom: Document): Promise<Document> {
    const labels = this.getLabels(dom)
    this.labels = labels
    return dom
  }

  getLabels(dom: Document) {
    const headers = dom.querySelectorAll('.container .panel-block strong')
    return Object.fromEntries(
      Array.from(headers).map(i => [
        i.textContent?.replace(':', '').trim(),
        i,
      ]),
    )
  }

  parseAvNumber() {
    const avNumber = this.labels['番號']?.parentElement
      ?.querySelector('.value')
      ?.textContent
      ?.trim()
    return avNumber ?? undefined
  }

  parseTitle(dom: Document) {
    const title = dom.querySelector('.current-title')?.textContent?.trim()
    return title ?? undefined
  }

  parseDate() {
    const date = this.labels['日期']?.parentElement
      ?.querySelector('.value')
      ?.textContent
      ?.trim()
    return date ? dayjs(date.replace(/[^\d-]/g, '')).valueOf() : 0
  }

  parseDuration() {
    const duration = this.labels['時長']?.parentElement
      ?.querySelector('.value')
      ?.textContent
      ?.trim()
    return duration ? Number(duration.replace(/\D/g, '')) : 0
  }

  parseDirector() {
    const directors
      = this.labels['導演']?.parentElement?.querySelectorAll('.value a')
    return directors?.length
      ? Array.from(directors)
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

  parseActor() {
    const actors
      = this.labels['演員']?.parentElement?.querySelectorAll('.value a')
    return actors?.length
      ? Array.from(actors).map((i) => {
          const href = i.getAttribute('href') ?? undefined
          const url = href ? new URL(href, this.baseUrl).href : undefined
          const file = href?.split('/').pop()
          /** 前两位是分组 */
          const fileGroup = file?.slice(0, 2).toLowerCase()
          const face = `https://c0.jdbstatic.com/avatars/${fileGroup}/${file}.jpg`
          return {
            name: i.textContent!,
            url,
            face,
            sex: i.nextElementSibling?.classList.contains('female')
              ? (1 as const)
              : i.nextElementSibling?.classList.contains('male')
                ? (0 as const)
                : undefined,
          }
        })
      : undefined
  }

  parseStudio() {
    const studios
      = this.labels['片商']?.parentElement?.querySelectorAll('.value a')
    return studios?.length
      ? Array.from(studios)
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

  parsePublisher() {
    return undefined
  }

  parseCover(dom: Document) {
    const cover = dom.querySelector('img.video-cover')?.getAttribute('src')
    return cover
      ? {
          url: new URL(cover, this.baseUrl).href,
          referer: this.detailUrl,
        }
      : undefined
  }

  /** TODO: 单页封面 */
  parseCoverSingle(): JavInfo['coverSingle'] {
    return {
      url: '',
      referer: this.detailUrl,
    }
  }

  parsePreview(dom: Document) {
    const previews = dom.querySelectorAll('.preview-images .tile-item')
    return previews.length
      ? Array.from(previews)
          .map(i => ({
            raw: i?.getAttribute('href') ?? undefined,
            thumbnail: i.querySelector('img')?.getAttribute('src') ?? undefined,
          }))
          .filter(i => !!i.raw || !!i.thumbnail)
      : undefined
  }

  parseSeries() {
    const series
      = this.labels['系列']?.parentElement?.querySelectorAll('.value a')
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

  parseCategory() {
    const categories
      = this.labels['類別']?.parentElement?.querySelectorAll('.value a')
    return categories?.length
      ? Array.from(categories)
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

  parseComments() {
    return []
  }
}
