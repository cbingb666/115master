import { expect, test } from '@playwright/test'
import { boot, HEADER_BTN, headerBtn, record, row, rows, watch } from './helpers'

const SEARCH_RE = /^https:\/\/webapi\.115\.com\/files\/search/

test.describe('搜索', () => {
  test('全局搜索：Enter 提交 → /files/search 参数正确 → 渲染结果', async ({ page }) => {
    const errors = watch(page)
    const reqs = record(page, SEARCH_RE)
    await boot(page)

    /** 顶栏搜索按钮打开全局搜索对话框 */
    await headerBtn(page, HEADER_BTN.search).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.ui-scrollbar.ui-scrollbar-md.overflow-y-auto')).toHaveCount(1)
    await dialog.getByPlaceholder('搜索文件，按 Enter 查看结果').fill('动漫')
    await page.keyboard.press('Enter')

    /** 路由进 /drive/search/0?keyword=动漫，面包屑显示搜索词 */
    await expect(page).toHaveURL(/#\/drive\/search\/0\?keyword=/)
    await expect(page.locator('.breadcrumbs')).toContainText('搜索: 动漫')

    /** /files/search 请求：search_value + 分页参数 */
    await expect.poll(() => reqs.length).toBeGreaterThan(0)
    const hit = reqs[0]
    expect(hit.url.searchParams.get('search_value')).toBe('动漫')
    expect(hit.url.searchParams.get('offset')).toBe('0')

    /** 渲染搜索结果：fixture 全库按名称包含过滤（folder 动漫 + 12 话） */
    await expect(rows(page)).toHaveCount(13)
    await expect(row(page, '动漫 第01话.mp4')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('搜索无结果：渲染空列表', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    await headerBtn(page, HEADER_BTN.search).click()
    await page.getByRole('dialog').getByPlaceholder('搜索文件，按 Enter 查看结果').fill('不存在的关键词')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/#\/drive\/search\/0\?keyword=/)
    await expect(rows(page)).toHaveCount(0)
    await expect(page.getByText('空文件夹')).toBeVisible()

    expect(errors).toEqual([])
  })
})
