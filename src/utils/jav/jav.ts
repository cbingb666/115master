import { javCache } from '@/utils/cache/javCache'
import { GMRequest } from '@/utils/request/gmRequst'

/** 来源 */
export enum JAV_SOURCE {
  JAVBUS = 'JavBus',
  JAVDB = 'JavDB',
  MISSAV = 'MissAV',
}

/** 导演 */
interface Director {
  /** 名称 */
  name: string
  /** 链接 */
  url?: string
}

/** 演员 */
interface Actor {
  /** 名称 */
  name: string
  /** 链接 */
  url?: string
  /** 性别 */
  sex?: 0 | 1
  /** face */
  face?: string
}

/** 类别 */
interface Category {
  /** 名称 */
  name: string
  /** 链接 */
  url?: string
}

/** 系列 */
interface Series {
  /** 名称 */
  name: string
  /** 链接 */
  url?: string
}

/** 片商 */
interface Studio {
  /** 名称 */
  name: string
  /** 链接 */
  url?: string
}

/** 发行商 */
interface Publisher {
  /** 名称 */
  name: string
  /** 链接 */
  url?: string
}

/** 预览图 */
interface Preview {
  /** 链接 */
  raw?: string
  /** 缩略图 */
  thumbnail?: string
}

interface Comment {
  /** 内容 */
  content: string
  /** 名称 */
  name: string
  /** 头像 */
  avatar?: string
  /** 评分 */
  score: number
  /** 时间 */
  time: number
  /** 点赞数 */
  likeCount: number
}

interface Cover {
  /** 链接 */
  url: string
  /** 基础 URL */
  referer?: string
}

/** 番号信息 */
export interface JavInfo {
  /** 来源 */
  source: JAV_SOURCE
  /** 基础 URL */
  baseUrl: string
  /** 链接 */
  detailUrl: string
  /** 搜索链接 */
  searchUrl: string
  /** 番号 */
  avNumber?: string
  /** 标题 */
  title?: string
  /** 日期 */
  date?: number
  /** 时长 */
  duration?: number
  /** 导演 */
  director?: Director[]
  /** 演员 */
  actors?: Actor[]
  /** 片商 */
  studio?: Studio[]
  /** 发行商 */
  publisher?: Publisher[]
  /** 封面（双页） */
  cover?: Cover
  /** 封面（单页） */
  coverSingle?: Cover
  /** 预览图 */
  preview?: Preview[]
  /** 系列 */
  series?: Series[]
  /** 类别 */
  category?: Category[]
  /** 评分 */
  score?: number
  /** 评价人数 */
  scoreCount?: number
  /** 观看人数 */
  viewCount?: number
  /** 下载人数 */
  downloadCount?: number
  /** 评论 */
  comments?: Comment[]
}

/** 未找到番号 */
export class JavNotFound extends Error {
  constructor() {
    super('未找到番号')
  }
}

/** 请求页面错误 */
export class JavPageError extends Error {
  constructor() {
    super('请求页面错误')
  }
}

/** Jav 抽象类 */
abstract class Jav {
  /** 未找到番号 */
  static NotFound = JavNotFound
  /** 请求页面错误 */
  static PageError = JavPageError
  /** 请求实例 */
  request = new GMRequest()
  /** 缓存实例 */
  private cache = javCache
  /** 基础 URL */
  abstract baseUrl: string
  /** 链接 */
  abstract detailUrl: string
  /** 搜索链接 */
  abstract searchUrl: string
  /** 来源 */
  abstract source: JAV_SOURCE

  /** 获取番号信息 */
  async getInfo(avNumber: string): Promise<JavInfo | undefined> {
    const info = await this.getInfoByCache(avNumber)
    if (info) {
      return info
    }
    const infoNew = await this.getInfoByAvNumber(avNumber)
    if (infoNew) {
      this.cache.set(`${this.source}:${avNumber}`, infoNew)
    }
    return infoNew ?? undefined
  }

  /** 获取番号信息缓存 */
  async getInfoByCache(avNumber: string): Promise<JavInfo | undefined> {
    const info = await this.cache.get(`${this.source}:${avNumber}`)
    if (info) {
      return info.value
    }
    return undefined
  }

  /** 解析番号信息 */
  async parseInfo(html: string): Promise<JavInfo | undefined> {
    let dom = new DOMParser().parseFromString(html, 'text/html')
    try {
      dom = await this.parseInfoBefore(dom)
    }
    catch {
      return undefined
    }
    const info: JavInfo = {
      source: this.source,
      baseUrl: this.baseUrl,
      detailUrl: this.detailUrl,
      searchUrl: this.searchUrl,
      avNumber: this.parseAvNumber(dom),
      title: this.parseTitle(dom),
      date: this.parseDate(dom),
      duration: this.parseDuration(dom),
      director: this.parseDirector(dom),
      actors: this.parseActor(dom),
      studio: this.parseStudio(dom),
      publisher: this.parsePublisher(dom),
      cover: this.parseCover(dom),
      coverSingle: this.parseCoverSingle(dom),
      preview: this.parsePreview(dom),
      series: this.parseSeries(dom),
      category: this.parseCategory(dom),
      score: this.parseScore?.(dom),
      scoreCount: this.parseScoreCount?.(dom),
      viewCount: this.parseViewCount?.(dom),
      downloadCount: this.parseDownloadCount?.(dom),
      comments: this.parseComments?.(dom),
    }
    const infoAfter = await this.parseInfoAfter(info)
    return infoAfter
  }

  /** 解析番号信息后 */
  async parseInfoBefore(dom: Document) {
    return dom
  }

  /** 解析番号信息后 */
  async parseInfoAfter(info: JavInfo) {
    return Promise.resolve(info)
  }

  /** 通过番号获取番号信息 */
  abstract getInfoByAvNumber(avNumber: string): Promise<JavInfo | undefined>

  /** 解析番号 */
  abstract parseAvNumber(dom: Document): string | undefined

  /** 解析标题 */
  abstract parseTitle(dom: Document): string | undefined

  /** 解析日期 */
  abstract parseDate(dom: Document): number | undefined

  /** 解析时长 */
  abstract parseDuration(dom: Document): number | undefined

  /** 解析导演 */
  abstract parseDirector(dom: Document): Director[] | undefined

  /** 解析演员 */
  abstract parseActor(dom: Document): Actor[] | undefined

  /** 解析片商 */
  abstract parseStudio(dom: Document): Studio[] | undefined

  /** 解析发行商 */
  abstract parsePublisher(dom: Document): Publisher[] | undefined

  /** 解析封面 */
  abstract parseCover(dom: Document): Cover | undefined

  /** 解析封面（单页） */
  abstract parseCoverSingle(dom: Document): Cover | undefined

  /** 解析预览图 */
  abstract parsePreview(dom: Document): Preview[] | undefined

  /** 解析系列 */
  abstract parseSeries(dom: Document): Series[] | undefined

  /** 解析类别 */
  abstract parseCategory(dom: Document): Category[] | undefined

  /** 解析评分 */
  parseScore?(dom: Document): number | undefined

  /** 解析评分人数 */
  parseScoreCount?(dom: Document): number | undefined

  /** 解析观看人数 */
  parseViewCount?(dom: Document): number | undefined

  /** 解析下载人数 */
  parseDownloadCount?(dom: Document): number | undefined

  /** 解析评论 */
  parseComments?(dom: Document): Comment[] | undefined
}

export type {
  Actor,
  JavInfo as AvInfo,
  Category,
  Director,
  Publisher,
  Series,
  Studio,
}

export { Jav }
