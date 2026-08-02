import { expect, test } from '@playwright/test'
import { FILES_RE } from '../../support'
import { boot, HEADER_BTN, headerBtn, menu, record, row, watch } from './helpers'

/** 页大小预设 30：根目录 43 项 → 2 页 */
const SMALL = { '115Master_pageSize': '30' }

test.describe('分页', () => {
  test('翻页：URL page 变化、按 offset/limit 请求、渲染对应切片', async ({ page }) => {
    const errors = watch(page)
    const reqs = record(page, FILES_RE)
    await boot(page, { storage: SMALL })

    /** 第一页：offset=0&limit=30，渲染前 30 项 */
    const p1 = reqs.find(r => r.method === 'GET')!
    expect(p1.url.searchParams.get('offset')).toBe('0')
    expect(p1.url.searchParams.get('limit')).toBe('30')
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '30')

    /** 43/30 → 2 页，分页器出现 */
    const pager = page.getByRole('button', { name: '下一页' })
    await expect(pager).toBeVisible()
    await pager.click()

    /** 页码走 URL query（useRouteQuery），请求 offset=30 */
    await expect(page).toHaveURL(/page=2/)
    await expect.poll(() => reqs.some(r =>
      r.url.searchParams.get('offset') === '30' && r.url.searchParams.get('limit') === '30',
    )).toBe(true)
    /** 第二页 13 项（视频 29-40 + 文档），第一页内容不再渲染 */
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '13')
    await expect(row(page, '说明文档.pdf')).toBeVisible()
    await expect(row(page, '演示视频 01.mp4')).toHaveCount(0)

    /** 回到上一页（page=1 是 useRouteQuery 默认值，URL 不带该参数） */
    await page.getByRole('button', { name: '上一页' }).click()
    await expect(page).not.toHaveURL(/page=/)
    await expect(row(page, '演示视频 01.mp4')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('页大小切换：localStorage 持久化并按新 limit 重新请求', async ({ page }) => {
    const errors = watch(page)
    const reqs = record(page, FILES_RE)
    await boot(page)

    /** 打开页大小菜单（ResponsiveMenu 下拉），选 30 */
    await headerBtn(page, HEADER_BTN.pageSize).click()
    /** 选项是无 href 的 a（PageSizeOptions），按文本定位 */
    await menu(page).locator('a', { hasText: /^30$/ }).click()

    /** useStorage 持久化 + 页码重置 + 按新 limit 请求 */
    expect(await page.evaluate(() => localStorage.getItem('115Master_pageSize'))).toBe('30')
    await expect.poll(() => reqs.some(r =>
      r.url.searchParams.get('limit') === '30' && r.url.searchParams.get('offset') === '0',
    )).toBe(true)
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '30')
    /** 43/30 → 分页器出现 */
    await expect(page.getByRole('button', { name: '下一页' })).toBeVisible()

    expect(errors).toEqual([])
  })
})
