import { expect, test } from '@playwright/test'
import { FILES_RE, json } from '../../support'
import { boot, menu, record, row, watch } from './helpers'

const SEARCH_RE = /^https:\/\/webapi\.115\.com\/files\/search/
const ORDER_RE = /^https:\/\/webapi\.115\.com\/files\/order/
const OFFLINE_RE = /^https:\/\/115\.com\/web\/lixian\?/

async function bootWithOffline(page: Parameters<typeof boot>[0]) {
  await boot(page, {
    mocks: api => api.override(OFFLINE_RE, ({ route }) => json(route, {
      state: true,
      count: 10,
      surplus: 8,
      used: 2,
      package: [],
      max_size: 0,
    })),
  })
}

async function openPicker(page: Parameters<typeof boot>[0]) {
  await page.getByRole('button', { name: '离线下载' }).click()
  const offline = page.getByRole('dialog', { name: '离线下载' })
  await expect(offline).toBeVisible()
  await offline.getByRole('button', { name: '选择' }).click()

  const picker = page.getByRole('dialog', { name: '选择保存目录' })
  await expect(picker).toBeVisible()
  await expect(picker.getByRole('list', { name: '文件列表' })).toBeVisible()
  return picker
}

async function closePicker(page: Parameters<typeof boot>[0]) {
  const picker = page.getByRole('dialog', { name: '选择保存目录' })
  if (await picker.count() > 0)
    await picker.locator('.ui-dialog__actions').getByRole('button', { name: '取消' }).click()

  const offline = page.getByRole('dialog', { name: '离线下载' })
  if (await offline.count() > 0)
    await offline.getByRole('button', { name: '取消' }).click()
}

test.describe('保存目录选择器', () => {
  test('搜索按钮可展开并加载搜索结果', async ({ page }) => {
    const errors = watch(page)
    const requests = record(page, SEARCH_RE)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    await picker.locator('button').nth(0).click()
    await picker.getByPlaceholder('搜索目录').fill('动漫')

    await expect.poll(() => requests.some(request => request.url.searchParams.get('search_value') === '动漫')).toBe(true)
    await expect(picker.getByRole('listitem').filter({ hasText: '动漫 第01话.mp4' })).toBeVisible()

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('新建按钮可打开新建文件夹对话框', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    await picker.locator('button').nth(1).click()

    const prompt = page.getByRole('dialog').filter({ hasText: '新建文件夹' })
    await expect(prompt).toBeVisible()
    await prompt.getByRole('button', { name: '取消' }).click()

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('分页按钮可切换到下一页', async ({ page }) => {
    const errors = watch(page)
    const requests = record(page, FILES_RE)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const next = picker.getByRole('button', { name: '下一页' })
    await expect(next).toBeVisible()
    await next.click()

    await expect.poll(() => requests.some(request => request.url.searchParams.get('offset') === '20')).toBe(true)
    await expect(row(page, '演示视频 21.mp4')).toBeVisible()

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('排序按钮可打开选项并刷新列表', async ({ page }) => {
    const errors = watch(page)
    const requests = record(page, FILES_RE)
    const orders = record(page, ORDER_RE)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    await picker.getByRole('button', { name: '当前排序：名称' }).click()
    await menu(page).getByRole('button', { name: '大小升序' }).click()

    await expect.poll(() => orders.length).toBe(1)
    await expect.poll(() => requests.some(request => request.url.searchParams.get('o') === 'file_size')).toBe(true)

    await closePicker(page)
    expect(errors).toEqual([])
  })
})
