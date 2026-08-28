import type { Page } from '@playwright/test'
import type { MockApi } from '../../support'
import { CORS, FILES_RE, json, MASTER_URL, setupHarness } from '../../support'

/**
 * 视频页 spec 自用 fixture 与 helper（不改动共享 support）
 * - EPISODES：3 集连续剧（parent 目录 2001），中文文件名避免触发番号（jav）请求
 * - installVideoMocks：files/video、播放列表（type=4）、历史、115 内嵌字幕的默认 mock
 * - download: true 时出现 Ultra 源，媒体请求被网络沙箱 abort → 原生内核加载错误态
 * - subtitles: true 时 thunder 返回两条字幕（subtitlecat 无番号恒空、115 内嵌为空列表）
 */

export const EPISODES = [
  { pc: 'e2e0000000001vid', n: '剧集 第01集.mp4', fid: '910000000000000001' },
  { pc: 'e2e0000000002vid', n: '剧集 第02集.mp4', fid: '910000000000000002' },
  { pc: 'e2e0000000003vid', n: '剧集 第03集.mp4', fid: '910000000000000003' },
] as const

/** 剧集所在目录 */
export const CID = '2001'

/** MASTER 视频页 URL */
export function videoUrl(pc: string) {
  return `${MASTER_URL}#/video/${pc}`
}

/** files/video 响应（形状对齐 Api.VideoApi.Res.FilesVideo） */
function videoInfo(ep: (typeof EPISODES)[number]) {
  return {
    state: true,
    inlay_power: 0,
    video_push_state: false,
    download_url: [],
    file_status: 1,
    thumb_url: '',
    height: '1080',
    width: '1920',
    video_url: '',
    video_url_demo: '',
    definition_list: {},
    multitrack_list: [],
    play_long: '3661',
    subtitle_info: [],
    outline_info: [],
    pick_code: ep.pc,
    file_name: ep.n,
    file_size: '1500000000',
    parent_id: CID,
    file_id: ep.fid,
    is_mark: '0',
    sha1: ep.fid.padStart(40, '0'),
    audio_list: '',
    user_def: 0,
    user_rotate: 0,
    user_turn: 0,
  }
}

/** 播放列表响应（/files?type=4，剧集 + path） */
function playlist(size = EPISODES.length) {
  const episodes = EPISODES.slice(0, size)
  return {
    state: true,
    count: episodes.length,
    file_count: episodes.length,
    folder_count: 0,
    is_asc: 1,
    order: 'file_name',
    fc_mix: 0,
    offset: 0,
    cur: 1,
    data: episodes.map((ep, i) => ({
      m: 0,
      n: ep.n,
      ns: ep.n,
      pc: ep.pc,
      s: 1500000000 + i * 1000000,
      t: 1753000000,
      tu: 1753000000,
      play_long: 3661,
      current_time: 0,
      sha: ep.fid.padStart(40, '0'),
      iv: 1,
      fc: 1,
      ico: 'mp4',
      pid: CID,
      vdi: 4,
      is_top: 0,
      u: '',
      score: 0,
      fid: ep.fid,
    })),
    path: [
      { cid: '0', name: '根目录', aid: '0', pid: '' },
      { cid: CID, name: '剧集', aid: '0', pid: '0' },
    ],
  }
}

/** 播放历史响应（未观看） */
function history() {
  return {
    state: true,
    data: {
      add_time: 0,
      category: 1,
      file_name: '',
      hash: '',
      pick_code: '',
      thumb: '',
      time: 0,
    },
  }
}

/** thunder 字幕项（形状对齐 subtitle-source 的 ThunderItem） */
function thunderItem(id: string, name: string) {
  return {
    gcid: `gcid-${id}`,
    cid: `cid-${id}`,
    url: `https://subs.e2e.local/${id}.srt`,
    ext: 'srt',
    name,
    duration: 3661000,
    languages: ['zh-CN'],
    source: 1,
    score: 100,
    fingerprintf_score: 100,
    extra_name: '',
    mt: 1,
  }
}

/** 字幕内容：首条 cue 覆盖 0s，播放器内核无时长也能命中 */
const SRT = `1
00:00:00,000 --> 00:00:04,000
第一行字幕

2
00:00:05,000 --> 00:00:09,000
第二行字幕
`

export interface VideoMockOptions {
  /** 提供原文件下载地址（出现 Ultra 源；媒体请求被沙箱 abort → 加载错误态） */
  download?: boolean
  /** thunder 返回两条字幕搜索结果 */
  subtitles?: boolean
  /** 播放列表包含的剧集数量 */
  playlistSize?: number
}

/** 安装视频页默认 mock；返回 files/video 的 pickcode 请求记录 */
export function installVideoMocks(api: MockApi, options: VideoMockOptions = {}) {
  const requested: string[] = []

  api.override(/^https:\/\/webapi\.115\.com\/files\/video/, ({ route, url }) => {
    const pc = url.searchParams.get('pickcode') ?? ''
    requested.push(pc)
    const ep = EPISODES.find(e => e.pc === pc)
    if (!ep)
      return json(route, { state: false, error: `unknown pickcode: ${pc}` })
    return json(route, videoInfo(ep))
  })

  /** 播放列表走 /files?type=4；其余 /files 请求落回共享默认 mock */
  api.override(FILES_RE, ({ route, url }) => {
    if (url.searchParams.get('type') !== '4')
      return
    return json(route, playlist(options.playlistSize))
  })

  api.override(/^https:\/\/webapi\.115\.com\/files\/history/, ({ route, request }) => {
    if (request.method() === 'POST')
      return json(route, { state: true })
    return json(route, history())
  })

  api.override(/^https:\/\/webapi\.115\.com\/movies\/subtitle/, ({ route }) => {
    return json(route, { state: true, data: { autoload: {}, list: [] } })
  })

  if (options.download) {
    api.override(/^https:\/\/webapi\.115\.com\/files\/download/, ({ route }) => {
      return json(route, { state: true, file_url: 'https://media.e2e.local/video.mp4' })
    })
  }

  if (options.subtitles) {
    api.override(/^https:\/\/api-shoulei-ssl\.xunlei\.com\/oracle\/subtitle/, ({ route }) => {
      return json(route, {
        code: 0,
        result: 'ok',
        data: [
          thunderItem('chs', '剧集 第01集.chs.srt'),
          thunderItem('eng', '剧集 第01集.eng.srt'),
        ],
      })
    })
    api.override(/^https:\/\/subs\.e2e\.local\//, async ({ route }) => {
      await route.fulfill({
        contentType: 'text/plain; charset=utf-8',
        headers: CORS,
        body: SRT,
      })
      return true
    })
  }

  return { requested }
}

export interface SetupOptions extends VideoMockOptions {
  /** 初始 GM 值（透传 setupHarness） */
  gmValues?: Record<string, unknown>
}

/** 一键装配视频页 harness */
export async function setupVideo(page: Page, options: SetupOptions = {}) {
  let requested: string[] = []
  await setupHarness(page, {
    gmValues: options.gmValues,
    mocks: (api) => {
      requested = installVideoMocks(api, options).requested
    },
  })
  return { requested }
}

/** 移动鼠标使控制栏显示，并悬停在控制栏上保持可见（播放键 disabled 时无法 hover，用画质键代替） */
export async function showControls(page: Page) {
  await page.mouse.move(720, 450)
  const quality = page.locator('button[title^="画质"]')
  await quality.waitFor({ state: 'attached' })
  await quality.hover()
}

/** 播放列表 modal Drawer。 */
export function sider(page: Page) {
  return page.locator('dialog[aria-label="播放列表"]')
}

export { gmStore, watch } from '../../support'
