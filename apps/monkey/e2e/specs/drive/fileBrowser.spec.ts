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
  test('标题和工具按钮显示在同一行', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const panel = picker.locator('[data-ui-dialog-panel]')
    const title = picker.getByRole('heading', { name: '选择保存目录' })
    const toolbar = picker.locator('[data-file-browser-toolbar]')
    const path = picker.locator('[data-file-browser-path]')
    const search = toolbar.locator('button').first()

    await expect(title).toBeVisible()
    await expect(search).toBeVisible()
    await expect(toolbar).toHaveCSS('padding-top', '20px')
    await expect(toolbar).toHaveCSS('padding-right', '24px')
    await expect(toolbar).toHaveCSS('padding-bottom', '0px')
    await expect(toolbar).toHaveCSS('padding-left', '24px')
    await expect.poll(async () => {
      const panelBox = await panel.boundingBox()
      const toolbarBox = await toolbar.boundingBox()
      if (!panelBox || !toolbarBox)
        return Number.POSITIVE_INFINITY
      return Math.abs(toolbarBox.y - panelBox.y)
    }).toBeLessThanOrEqual(1)
    await expect.poll(async () => {
      const toolbarBox = await toolbar.boundingBox()
      const pathBox = await path.boundingBox()
      if (!toolbarBox || !pathBox)
        return Number.POSITIVE_INFINITY
      return Math.abs(pathBox.y - toolbarBox.y - toolbarBox.height)
    }).toBeLessThanOrEqual(1)
    await expect.poll(async () => {
      const titleBox = await title.boundingBox()
      const searchBox = await search.boundingBox()
      if (!titleBox || !searchBox)
        return Number.POSITIVE_INFINITY
      return Math.abs(
        titleBox.y + titleBox.height / 2 - searchBox.y - searchBox.height / 2,
      )
    }).toBeLessThanOrEqual(1)

    await closePicker(page)
    expect(errors).toEqual([])
  })

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

  test('分页器吸附在列表底部，滚动到底后不遮挡列表', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const scroll = picker.locator('[data-file-browser-scroll]')
    const dock = picker.locator('[data-file-browser-pagination]')
    const pagination = dock.locator(':scope > *')

    await expect(dock).toHaveCSS('position', 'sticky')
    await expect.poll(async () => {
      const listBox = await scroll.boundingBox()
      const paginationBox = await pagination.boundingBox()
      if (!listBox || !paginationBox)
        return false
      return listBox.y + listBox.height - paginationBox.y - paginationBox.height
    }).toBe(16)

    await scroll.evaluate(element => element.scrollTo({ top: element.scrollHeight }))
    await expect.poll(() => scroll.evaluate(element => (
      element.scrollHeight - element.clientHeight - element.scrollTop
    ))).toBe(0)
    await expect.poll(async () => {
      const listBox = await picker.getByRole('list', { name: '文件列表' }).boundingBox()
      const paginationBox = await pagination.boundingBox()
      if (!listBox || !paginationBox)
        return Number.POSITIVE_INFINITY
      return listBox.y + listBox.height - paginationBox.y
    }).toBeLessThanOrEqual(0)

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('排序按钮可打开选项并刷新列表', async ({ page }) => {
    const errors = watch(page)
    const requests = record(page, FILES_RE)
    const orders = record(page, ORDER_RE)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    await picker.getByRole('button', { name: '当前排序：名称 A–Z' }).click()
    await menu(page).getByRole('radio', { name: '最小优先' }).click()

    await expect.poll(() => orders.length).toBe(1)
    await expect.poll(() => requests.some(request => request.url.searchParams.get('o') === 'file_size')).toBe(true)

    await closePicker(page)
    expect(errors).toEqual([])
  })
})
