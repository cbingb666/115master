import { expect, test } from '@playwright/test'
import { dirs, FILES_RE, filesRes, json } from '../../support'
import { boot, HEADER_BTN, headerBtn, record, row, rows, watch } from './helpers'

test.describe('列表渲染', () => {
  test('渲染文件/文件夹行与名称、大小、时间列', async ({ page }) => {
    const errors = watch(page)
    const reqs = record(page, FILES_RE)
    await boot(page)

    /** 初始请求：默认页大小 256、根目录 cid=0、未排序时不带 o/asc 参数 */
    const first = reqs.find(r => r.method === 'GET')!
    expect(first.url.searchParams.get('cid')).toBe('0')
    expect(first.url.searchParams.get('offset')).toBe('0')
    expect(first.url.searchParams.get('limit')).toBe('256')
    expect(first.url.searchParams.get('o')).toBeNull()

    /** 根目录 43 项全部渲染（2 文件夹 + 40 视频 + 1 文档） */
    await expect(rows(page)).toHaveCount(43)

    /** 文件夹行：名称渲染，s=0 不渲染大小列（FileItemContent 按 s 真值渲染） */
    const dir = row(page, '动漫')
    await expect(dir.locator('span[title="动漫"]')).toBeVisible()
    await expect(dir.locator('.app-font-file-size')).toHaveCount(0)

    /** 视频行：名称 + 大小 + 修改时间列 */
    const video = row(page, '演示视频 01.mp4')
    await expect(video.locator('span[title="演示视频 01.mp4"]')).toBeVisible()
    await expect(video.locator('.app-font-file-size')).not.toBeEmpty()
    await expect(video.locator('[data-tip="修改时间"]')).not.toBeEmpty()

    expect(errors).toEqual([])
  })

  test('切换视图：card → list，偏好写入 localStorage', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    /** 默认卡片视图（useStorage 缺省 card） */
    const grid = page.locator('[data-view-type]').first()
    await expect(grid).toHaveAttribute('data-view-type', 'card')

    await headerBtn(page, HEADER_BTN.view).click()
    await expect(page.locator('[data-view-type]').first()).toHaveAttribute('data-view-type', 'list')
    expect(await page.evaluate(() => localStorage.getItem('115Master_drive_view_type'))).toBe('list')

    expect(errors).toEqual([])
  })

  test('空目录态：渲染空提示而非列表', async ({ page }) => {
    const errors = watch(page)
    await boot(page, {
      mocks: api => api.override(FILES_RE, ({ route, url }) => {
        if (url.searchParams.get('cid') !== '1002')
          return
        const res = filesRes(dirs['1002'], 0, 256)
        return json(route, { ...res, count: 0, file_count: 0, folder_count: 0, data: [] })
      }),
    })

    await row(page, '电影').click()
    await expect(page).toHaveURL(/#\/drive\/1002/)
    /** FileList empty → Empty 默认描述「空文件夹」 */
    await expect(page.getByText('空文件夹')).toBeVisible()
    await expect(rows(page)).toHaveCount(0)

    expect(errors).toEqual([])
  })
})
