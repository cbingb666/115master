import { expect, test } from '@playwright/test'
import { FILES_RE } from '../../support'
import { boot, menu, record, watch } from './helpers'

const ORDER_RE = /^https:\/\/webapi\.115\.com\/files\/order/

/** 解析 urlencoded POST body */
function body(postData: string | null) {
  return new URLSearchParams(postData ?? '')
}

test.describe('排序', () => {
  test('切换排序：持久化到 /files/order 并按新排序重新请求', async ({ page }) => {
    const errors = watch(page)
    const gets = record(page, FILES_RE)
    const posts = record(page, ORDER_RE)
    await boot(page)

    /** mock 响应 order=file_name/asc=1 → 排序按钮回显「名称」 */
    const trigger = page.getByRole('button', { name: '当前排序：名称' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    /** SortOptions：点「大小升序」（aria-label 由 order+asc 组成） */
    await menu(page).getByRole('button', { name: '大小升序' }).click()

    /** changeSort 先 POST /files/order 持久化 */
    await expect.poll(() => posts.length).toBe(1)
    const form = body(posts[0].postData)
    expect(form.get('file_id')).toBe('0')
    expect(form.get('user_order')).toBe('file_size')
    expect(form.get('user_asc')).toBe('1')
    expect(form.get('fc_mix')).toBe('0')

    /** 再按新排序重新请求列表 */
    await expect.poll(() => gets.some(r => r.url.searchParams.get('o') === 'file_size')).toBe(true)
    const reload = gets.find(r => r.url.searchParams.get('o') === 'file_size')!
    expect(reload.url.searchParams.get('asc')).toBe('1')
    expect(reload.url.searchParams.get('offset')).toBe('0')

    expect(errors).toEqual([])
  })

  test('目录置顶开关：fc_mix 翻转后持久化并重新请求', async ({ page }) => {
    const errors = watch(page)
    const gets = record(page, FILES_RE)
    const posts = record(page, ORDER_RE)
    await boot(page)

    await page.getByRole('button', { name: '当前排序：名称' }).click()
    /** fc_mix=0 → 目录置顶 toggle 初始勾选；点击翻转为混排 */
    const toggle = menu(page).getByRole('checkbox')
    await expect(toggle).toBeChecked()
    await toggle.click()

    await expect.poll(() => posts.length).toBe(1)
    const form = body(posts[0].postData)
    expect(form.get('user_order')).toBe('file_name')
    expect(form.get('fc_mix')).toBe('1')

    await expect.poll(() => gets.some(r => r.url.searchParams.get('fc_mix') === '1')).toBe(true)

    expect(errors).toEqual([])
  })
})
