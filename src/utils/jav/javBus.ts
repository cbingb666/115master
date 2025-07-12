import type { JavInfo } from './jav'
import dayjs from 'dayjs'
import { Jav, JAV_SOURCE } from './jav'

/**
 * JavBus 类
 */
export class JavBus extends Jav {
  source = JAV_SOURCE.JAVBUS
  baseUrl = 'https://www.javbus.com'
  detailUrl = ''
  searchUrl = ''
  labels: { [k: string]: Element | undefined } = {}

  async getInfoByAvNumber(avNumber: string): Promise<JavInfo | undefined> {
    const detailUrl = new URL(avNumber, this.baseUrl).href
    const searchUrl = new URL(`/search/${avNumber}`, this.baseUrl).href
    this.detailUrl = detailUrl
    this.searchUrl = searchUrl
    const html = await this.request.get(detailUrl)
    if (html.status === 404) {
      throw new Jav.NotFound()
    }
    if (html.status !== 200 && html.status !== 302) {
      throw new Jav.PageError()
    }
    return await this.parseInfo(await html.text())
  }

  async parseInfoBefore(dom: Document): Promise<Document> {
    const errorPage = dom.querySelector('.error-page')
    if (errorPage) {
      throw new Jav.NotFound()
    }

    const labels = this.getLabels(dom)
    this.labels = labels
    return dom
  }

  async parseInfoAfter(info: JavInfo): Promise<JavInfo> {
    return {
      ...info,
      title: info.title
        ?.replace(new RegExp(`^${info.avNumber}`, 'i'), '')
        .trim(),
    }
  }

  getLabels(dom: Document) {
    const headers = dom.querySelectorAll(
      '.container .movie .info p > span.header, .container .movie .info p.header',
    )
    return Object.fromEntries(
      Array.from(headers).map(i => [
        i.textContent?.replace(':', '').trim(),
        i,
      ]),
    )
  }

  parseAvNumber() {
    return this.labels['識別碼']?.nextElementSibling?.textContent?.trim() ?? ''
  }

  parseTitle(dom: Document) {
    const title = dom.querySelector('.container h3')?.textContent?.trim()
    return title
  }

  parseDate() {
    const date = this.labels['發行日期']?.parentElement?.textContent
    return date
      ? dayjs(date.trim().replace(/[^\d-]/g, '')).valueOf()
      : undefined
  }

  parseDuration() {
    const duration = this.labels['長度']?.parentElement?.textContent
    return duration ? Number(duration.trim().replace(/\D/g, '')) : undefined
  }

  parseDirector() {
    const directors = this.labels['導演']?.parentElement?.querySelectorAll('a')
    return directors?.length
      ? Array.from(directors).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parseActor() {
    const actors
      = this.labels['演員']?.parentElement?.nextElementSibling?.querySelectorAll(
        'li',
      )
    return actors?.length
      ? Array.from(actors).map((i) => {
          const a = i.querySelector('a')
          const img = i.querySelector('img')

          // TODO 暂时无法加载头像，需要专门写个支持油猴跨域加载的图片组件来加载
          // const faceHref = img?.getAttribute("src");
          // const face = faceHref
          // ? new URL(faceHref, this.baseUrl).href
          // : undefined;
          return {
            name: img?.getAttribute('title') ?? '',
            url: a?.getAttribute('href') ?? undefined,
            sex: undefined,
            face: '',
          }
        })
      : undefined
  }

  parseStudio() {
    const studios = this.labels['製作商']?.parentElement?.querySelectorAll('a')
    return studios?.length
      ? Array.from(studios).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parsePublisher() {
    const publishers
      = this.labels['發行商']?.parentElement?.querySelectorAll('a')
    return publishers?.length
      ? Array.from(publishers).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parseCover(dom: Document) {
    const cover = dom
      .querySelector('.container .bigImage img')
      ?.getAttribute('src')

    if (!cover) {
      return undefined
    }

    if (cover.includes('https://')) {
      return {
        url: cover,
      }
    }

    return {
      url: new URL(cover, this.baseUrl).href,
      referer: this.detailUrl,
    }
  }

  parseCoverSingle(dom: Document) {
    const cover = dom
      .querySelector('.container .bigImage img')
      ?.getAttribute('src')
    return cover
      ? {
          url: new URL(
            cover.replace('_b', '').replace('cover', 'thumb'),
            this.baseUrl,
          ).href,
          referer: this.searchUrl,
        }
      : undefined
  }

  parsePreview(dom: Document) {
    const previews = dom.querySelectorAll('#sample-waterfall a')
    return previews.length
      ? Array.from(previews)
          .map(preview => ({
            raw: preview.getAttribute('href') ?? undefined,
            thumbnail:
              preview.querySelector('img')?.getAttribute('src') ?? undefined,
          }))
          .filter(i => !!i.raw || !!i.thumbnail)
          .map((i) => {
            return {
              raw: i.raw,
              thumbnail: i.thumbnail
                ? new URL(i.thumbnail, this.baseUrl).href
                : undefined,
            }
          })
      : undefined
  }

  parseSeries() {
    const series = this.labels['系列']?.parentElement?.querySelectorAll('a')
    return series?.length
      ? Array.from(series).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parseCategory() {
    const categories
      = this.labels['類別']?.nextElementSibling?.querySelectorAll('a')
    return categories?.length
      ? Array.from(categories).map(i => ({
          name: i.textContent!,
          url: i.getAttribute('href') ?? undefined,
        }))
      : undefined
  }

  parseComments() {
    return []
  }
}
