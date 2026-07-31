import type { Page, Request, Route } from '@playwright/test'
import { filesDownloadLimited, proDownurlUnavailable } from './fixtures/download'
import { dirs, filesRes, searchRes } from './fixtures/files'
import { filesOrderOk } from './fixtures/order'
import { spaceInfo } from './fixtures/space'
import { userAq } from './fixtures/user'
import { homeHtml } from './pages/homeHtml'
import { masterHtml } from './pages/masterHtml'

/**
 * 路由式 mock：单条 page.route 通配路由内按注册顺序匹配 URL
 * - handler 返回 true 表示已 fulfill；返回 undefined 继续匹配下一条
 * - 全部不匹配 → abort（网络沙箱，任何未 mock 的请求都不会出网）
 * - spec 通过 setupHarness({ mocks }) 用 override 覆盖默认数据
 */

export interface Ctx {
  route: Route
  request: Request
  url: URL
}

export type Handler = (ctx: Ctx) => boolean | void | Promise<boolean | void>

interface Entry {
  match: RegExp
  handler: Handler
}

/** 跨域响应头：fixture 页面在 115.com 下，webapi/proapi/my 均为跨域 fetch */
export const CORS = {
  'access-control-allow-origin': 'https://115.com',
  'access-control-allow-credentials': 'true',
}

/** webapi /files 文件列表路由（spec 录制/覆盖同一端点时复用） */
export const FILES_RE = /^https:\/\/webapi\.115\.com\/files(\?|$)/

/** 以 JSON fulfill（带 CORS 头），返回 true */
export async function json(route: Route, data: unknown, status = 200): Promise<true> {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    headers: CORS,
    body: JSON.stringify(data),
  })
  return true
}

/** 以 HTML fulfill；Origin-Agent-Cluster ?0 允许脚本设置 document.domain */
export async function html(route: Route, body: string): Promise<true> {
  await route.fulfill({
    contentType: 'text/html; charset=utf-8',
    headers: { ...CORS, 'origin-agent-cluster': '?0' },
    body,
  })
  return true
}

export class MockApi {
  private entries: Entry[] = []

  /** 追加 handler（按注册顺序匹配） */
  use(match: RegExp, handler: Handler) {
    this.entries.push({ match, handler })
    return this
  }

  /** 插入优先 handler（覆盖默认数据用） */
  override(match: RegExp, handler: Handler) {
    this.entries.unshift({ match, handler })
    return this
  }

  /** 安装到 page：一条通配路由承接全部请求 */
  async install(page: Page) {
    await page.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      for (const entry of this.entries) {
        if (!entry.match.test(url.href))
          continue
        if (await entry.handler({ route, request, url }))
          return
      }
      await route.abort()
    })
  }
}

function num(url: URL, key: string, fallback: number) {
  const value = Number(url.searchParams.get(key))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/** 默认 mock：fixture 文档 + drive115 关键 API（未匹配的请求一律 abort，新端点必须显式注册） */
export function defaults() {
  const api = new MockApi()

  /** CORS 预检一律放行 */
  api.use(/.*/, async ({ route, request }) => {
    if (request.method() !== 'OPTIONS')
      return
    await route.fulfill({
      status: 204,
      headers: {
        ...CORS,
        'access-control-allow-methods': '*',
        'access-control-allow-headers': '*',
      },
    })
    return true
  })

  /** MASTER 文档（独立 SPA 空壳） */
  api.use(/^https:\/\/115\.com\/web\/lixian\/master/, ({ route, request }) => {
    if (!request.isNavigationRequest())
      return
    return html(route, masterHtml())
  })

  /** HOME 文档（官方文件列表 DOM） */
  api.use(/^https:\/\/115\.com\/\?/, ({ route, request }) => {
    if (!request.isNavigationRequest())
      return
    return html(route, homeHtml())
  })

  /** 视频 m3u8：返回未转码错误，走 NotFoundM3u8File 友好降级 */
  api.use(/^https:\/\/115\.com\/api\/video\/m3u8\//, ({ route }) => {
    return json(route, { state: false, error: 'not found', errno: 0 })
  })

  /** 演员头像数据库：空库（actressFaceDB 初始化走完整流程，findActress 恒 miss） */
  api.use(/^https:\/\/fastly\.jsdelivr\.net\/gh\/gfriends\/gfriends[^/]*\/Filetree\.json/, ({ route }) => {
    return json(route, { Content: {} })
  })

  /** iconify 图标 API（含官方备用域名）：空图标集，避免外网请求噪音 */
  api.use(/^https:\/\/api\.(iconify\.design|unisvg\.com|simplesvg\.com)\//, ({ route, url }) => {
    const prefix = url.pathname.replace(/^\//, '').replace(/\.json.*$/, '')
    return json(route, { prefix, icons: {}, aliases: {} })
  })

  /** 用户信息 */
  api.use(/^https:\/\/my\.115\.com\/.*ac=get_user_aq/, ({ route }) => {
    return json(route, userAq)
  })

  /** 空间信息 */
  api.use(/^https:\/\/webapi\.115\.com\/files\/index_info/, ({ route }) => {
    return json(route, spaceInfo)
  })

  /** 文件搜索 */
  api.use(/^https:\/\/webapi\.115\.com\/files\/search/, ({ route, url }) => {
    const keyword = url.searchParams.get('search_value') ?? ''
    return json(route, searchRes(keyword, num(url, 'offset', 0), num(url, 'limit', 30)))
  })

  /** 文件列表（webapi 主接口 + aps 兜底接口） */
  const files: Handler = ({ route, url }) => {
    const cid = url.searchParams.get('cid') ?? '0'
    const dir = dirs[cid]
    if (!dir)
      return json(route, { state: false, error: `unknown cid: ${cid}`, errno: 0 })
    return json(route, filesRes(dir, num(url, 'offset', 0), num(url, 'limit', 30)))
  }
  api.use(FILES_RE, files)
  api.use(/^https:\/\/aps\.115\.com\/natsort\/files\.php/, files)

  /** Pro 下载：mock 无法构造加密响应，固定失败 → 回退普通下载 */
  api.use(/^https:\/\/proapi\.115\.com\/app\/chrome\/downurl/, ({ route }) => {
    return json(route, proDownurlUnavailable)
  })

  /** 普通下载：默认受限失败；需要成功下载地址的 spec 用 override 覆盖 */
  api.use(/^https:\/\/webapi\.115\.com\/files\/download/, ({ route }) => {
    return json(route, filesDownloadLimited)
  })

  /** 设置文件排序 */
  api.use(/^https:\/\/webapi\.115\.com\/files\/order/, ({ route }) => {
    return json(route, filesOrderOk)
  })

  return api
}
