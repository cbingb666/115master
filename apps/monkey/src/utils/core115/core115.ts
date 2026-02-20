import type { Core as CoreType, MockjQueryObject } from './core115.types'
import { GM_addStyle, unsafeWindow } from '$'

/** 115 官方资源 URL */
const OFFICIAL_ASSETS = [
  'https://cdnassets.115.com/??libs/jquery-1.7.2.js,jquery-extend.js,libs/json2.js,oofUtil.js,paths.js,oofUtil/subscribe.js,commonFrame/urlMaintain.js,ajax/bridge.js?v=1770867925',
  'https://cdnassets.115.com/??libs/jquery-1.7.2.js,jquery-extend.js?v=1770867925',
  'https://cdnres.115.com/site/static/js/min/util-min.js?_vh=be49060_92',
  'https://cdnres.115.com/site/static/js/wl_disk2014/min/core-min.js?_vh=d376e38_92',
]

const OFFICIAL_STYLES = [
  'https://cdnres.115.com/site/static/style_v11.2/common/css/common.css?_vh=107da41_92',
  'https://cdnres.115.com/site/static/style_v11.2/common/css/dialog_box.css?_vh=f17e241_92',
]

/**
 * 将脚本注入到页面上下文中（而非 Tampermonkey 沙箱）
 * 这是必需的，因为 115 SDK 的 Bridge 系统需要在页面上下文中运行
 */
function injectScriptToPageContext(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    /** 创建 script 标签 */
    const script = document.createElement('script')
    script.src = url
    script.async = false // 保持加载顺序

    // 重要：将 script 注入到页面中，而不是 Tampermonkey 沙箱
    // 这样 115 SDK 就能在页面上下文中运行，Bridge 系统才能正常工作
    ;(document.head || document.documentElement).appendChild(script)

    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`))
  })
}

async function loadScriptsInOrder(urls: string[]): Promise<void> {
  for (const url of urls) {
    await injectScriptToPageContext(url)
  }
}

async function loadStyle(href: string) {
  const style = document.createElement('link')
  style.rel = 'stylesheet'
  style.href = href
  document.head.appendChild(style)
  GM_addStyle(`
   #my-app a, #my-app a * {
    color: var(--color-base-content, inherit);
  }`)
}

async function loadStyles(urls: string[]): Promise<void> {
  for (const url of urls) {
    loadStyle(url)
  }
}

/** SDK 加载状态 */
let isLoaded = false

export async function load() {
  if (isLoaded) {
    return
  }

  await loadStyles(OFFICIAL_STYLES)
  await loadScriptsInOrder(OFFICIAL_ASSETS)

  // 等待 Core 对象加载
  await new Promise<void>((resolve) => {
    /** 使用 unsafeWindow */
    const win = getPageWindow()
    const checkCore = () => {
      if (typeof win !== 'undefined' && (win as any).Core) {
        resolve()
      }
      else {
        setTimeout(checkCore, 50)
      }
    }
    checkCore()
  })

  // 初始化 UDataAPI
  initUDataAPI()

  console.log('[115Master] ✅ Core SDK loaded successfully')
  isLoaded = true
}

/**
 * 初始化 Core.DataAccess.UDataAPI
 *
 * 在 Tampermonkey 环境中，直接使用 jQuery 的 AJAX 功能进行 API 调用
 */
function initUDataAPI() {
  const win = getPageWindow()
  const $ = win.$
  const Core = win.Core

  if (!Core || !$) {
    console.error('[115Master] Core or jQuery not loaded')
    return
  }

  // 如果已经初始化过，跳过
  if (Core.DataAccess.UDataAPI) {
    return
  }

  /** 处理 URL */
  function processUrl(url: string): string {
    if (url.startsWith('/')) {
      return `//webapi.115.com${url}`
    }
    return url
  }

  // 初始化 UDataAPI
  Core.DataAccess.UDataAPI = {
    ajax: (settings: any) => {
      return $.ajax({
        ...settings,
        url: processUrl(settings.url),
        xhrFields: {
          withCredentials: true,
        },
      })
    },
  }
}

/**
 * 获取页面上下文中的 Core 对象
 * 注意：115 SDK 运行在页面上下文中，需要通过 unsafeWindow 访问
 */
function getPageWindow(): any {
  // 115 SDK 注入到页面上下文，需要访问 unsafeWindow
  // 不能使用 window（Tampermonkey 沙箱），否则无法访问 Core 对象
  return unsafeWindow
}

/**
 * 获取 115 Core SDK
 */
export function getCore(): CoreType | undefined {
  return getPageWindow().Core
}

/**
 * 创建模拟 jQuery 对象，用于 115 SDK 文件操作
 * @param attributes 文件属性对象
 */
export function createMockjQueryObject(attributes: Record<string, string>): MockjQueryObject {
  return {
    attr: (key: string) => {
      return attributes[key] || ''
    },
  }
}

/** 全局对象（包含 Core SDK） */
export const global = getPageWindow() as unknown as { Core: CoreType }
