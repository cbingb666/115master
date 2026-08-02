import { expect, test } from '@playwright/test'
import { FILES_RE } from '../../support'
import { boot, record, row, watch } from './helpers'

test.describe('目录导航', () => {
  test('星标页：面包屑显示星标', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    await page.getByRole('link', { name: '星标', exact: true }).click()

    await expect(page).toHaveURL(/#\/drive\/star$/)
    await expect(page.locator('.breadcrumbs [aria-current="page"]')).toHaveText('星标')
    expect(errors).toEqual([])
  })

  test('点文件夹进入子目录：hash 变化、按新 cid 请求、渲染子目录', async ({ page }) => {
    const errors = watch(page)
    const reqs = record(page, FILES_RE)
    await boot(page)

    await row(page, '动漫').click()

    /** hash 路由 /drive/:area?/:cid? → #/drive/1001 */
    await expect(page).toHaveURL(/#\/drive\/1001$/)
    /** 渲染子目录 12 项 */
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '12')
    await expect(row(page, '动漫 第01话.mp4')).toBeVisible()

    /** 发出了 cid=1001 的 /files 请求 */
    const sub = reqs.find(r => r.url.searchParams.get('cid') === '1001')
    expect(sub).toBeTruthy()
    expect(sub!.url.searchParams.get('offset')).toBe('0')

    /** 面包屑：根目录链接 + 当前目录 Pill */
    const crumbs = page.locator('.breadcrumbs')
    await expect(crumbs.getByRole('link', { name: '根目录' })).toHaveAttribute('href', '#/drive')
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('动漫')

    expect(errors).toEqual([])
  })

  test('面包屑返回根目录：hash 回退、按 cid=0 重新请求', async ({ page }) => {
    const errors = watch(page)
    const reqs = record(page, FILES_RE)
    await boot(page)

    await row(page, '动漫').click()
    await expect(page).toHaveURL(/#\/drive\/1001$/)
    await expect(row(page, '动漫 第01话.mp4')).toBeVisible()

    await page.locator('.breadcrumbs').getByRole('link', { name: '根目录' }).click()

    /** handleClickPath 以 cid='' 导航 → #/drive/ */
    await expect(page).toHaveURL(/#\/drive\/?$/)
    await expect(row(page, '演示视频 01.mp4')).toBeVisible()
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '43')

    /** 返回后再次请求根目录（SWR 重新校验） */
    const back = reqs.filter(r => r.url.searchParams.get('cid') === '0')
    expect(back.length).toBeGreaterThanOrEqual(2)

    expect(errors).toEqual([])
  })

  test('浏览器后退：恢复上一目录内容', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    await row(page, '动漫').click()
    await expect(row(page, '动漫 第01话.mp4')).toBeVisible()

    await page.goBack()

    /** 回到根目录：缓存命中立即渲染（SWR 后台重新校验） */
    await expect(page).toHaveURL(/#\/drive\/0?$/)
    await expect(row(page, '演示视频 01.mp4')).toBeVisible()
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '43')

    /** 再次前进到子目录 */
    await page.goForward()
    await expect(page).toHaveURL(/#\/drive\/1001$/)
    await expect(row(page, '动漫 第01话.mp4')).toBeVisible()

    expect(errors).toEqual([])
  })
})
