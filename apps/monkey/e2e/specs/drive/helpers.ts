import type { Page, Request } from '@playwright/test'
import type { HarnessOptions } from '../../support'
import { expect } from '@playwright/test'
import { MASTER_URL, setupHarness } from '../../support'

export { watch } from '../../support'

export interface BootOptions extends HarnessOptions {
  /** 应用层 localStorage 预设（pageSize / 视图等 useStorage 键） */
  storage?: Record<string, string>
}

/** 装配 harness 并进入 MASTER 网盘页，等首屏列表渲染完成 */
export async function boot(page: Page, options: BootOptions = {}) {
  await setupHarness(page, options)
  if (options.storage) {
    const entries = Object.entries(options.storage)
    await page.addInitScript((pairs) => {
      for (const [k, v] of pairs)
        localStorage.setItem(k, v)
    }, entries)
  }
  await page.goto(MASTER_URL)
  /** 等首屏：根目录首项（文件夹「动漫」）出现即列表已渲染 */
  await expect(row(page, '动漫').first()).toBeVisible()
}

/** 文件行（data-selection-key=统一文件/目录 ID，见 useFileList.itemProps） */
export function rows(page: Page) {
  return page.locator('[data-selection-key]')
}

/** 按名称定位文件行（FileItemContent 以 span[title] 承载文件名） */
export function row(page: Page, name: string) {
  return page.locator(`[data-selection-key]:has(span[title="${name}"])`)
}

/** 顶栏（Header.tsx 的 @container 外壳） */
export function header(page: Page) {
  return page.locator('.header-sticky-effect')
}

/**
 * 顶栏按钮序：搜索 / 新建 / 页大小 / 排序 / 视图切换
 * （面包屑是 a/span 不是 button；「更多」按钮 @[480px] 下隐藏，getByRole 不计）
 */
export const HEADER_BTN = { search: 0, newFolder: 1, pageSize: 2, sort: 3, view: 4 } as const

export function headerBtn(page: Page, index: number) {
  return header(page).getByRole('button').nth(index)
}

/** 记录匹配请求（URL + method + postData），在触发动作前调用 */
export function record(page: Page, match: RegExp) {
  const reqs: { url: URL, method: string, postData: string | null }[] = []
  page.on('request', (req: Request) => {
    if (match.test(req.url()))
      reqs.push({ url: new URL(req.url()), method: req.method(), postData: req.postData() })
  })
  return reqs
}

/** teleported 下拉/右键菜单（ContextMenu / Dropdown 共用 .menu.ui-glass-floating） */
export function menu(page: Page) {
  return page.locator('.menu.ui-glass-floating')
}
