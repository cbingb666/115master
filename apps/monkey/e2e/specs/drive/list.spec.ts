import { expect, test } from '@playwright/test'
import { dirs, FILES_RE, filesRes, json, video } from '../../support'
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

    /** 根目录逻辑上有 43 项；小列表允许 overscan 一次渲染完整。 */
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '43')

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

  test('桌面布局：主内容与侧栏之间没有缝隙', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    const geometry = await page.locator('[data-ui-header-content]').evaluate((header) => {
      const main = header.parentElement?.parentElement
      const width = Number.parseFloat(getComputedStyle(main!).marginLeft)
      return {
        mainLeft: main!.getBoundingClientRect().left,
        siderRight: document
          .querySelector<HTMLButtonElement>('button[title="偏好设置"]')!
          .closest<HTMLElement>('.fixed')!
          .getBoundingClientRect()
          .right,
        width,
      }
    })

    expect(geometry.width).toBeGreaterThan(0)
    expect(geometry.mainLeft).toBe(geometry.siderRight)
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

  test('1000 项使用 window 原生滚动且 DOM 数量有界', async ({ page }) => {
    const errors = watch(page)
    const dir = {
      ...dirs['0'],
      items: [
        ...dirs['0'].items.slice(0, 2),
        ...Array.from({ length: 998 }, (_, index) =>
          video(`虚拟文件 ${String(index + 1).padStart(4, '0')}.mp4`, '0')),
      ],
    }
    await boot(page, {
      storage: {
        '115Master_drive_view_type': 'list',
        '115Master_pageSize': '1000',
      },
      mocks: api => api.override(FILES_RE, ({ route, url }) => {
        if (url.searchParams.get('cid') !== '0')
          return
        return json(route, filesRes(
          dir,
          Number(url.searchParams.get('offset') ?? 0),
          Number(url.searchParams.get('limit') ?? 1000),
        ))
      }),
    })

    const list = page.getByRole('list', { name: '文件列表' })
    await expect(list).toHaveAttribute('data-file-list-total', '1000')
    expect(await rows(page).count()).toBeLessThan(80)
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight > document.scrollingElement!.clientHeight)).toBe(true)

    await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight))
    await expect(row(page, '虚拟文件 0998.mp4')).toBeVisible()
    expect(await rows(page).count()).toBeLessThan(80)

    /** 布局重排和目录往返都以文件 ID 恢复同一滚动锚点。 */
    await headerBtn(page, HEADER_BTN.view).click()
    await expect(list).toHaveAttribute('data-view-type', 'card')
    await expect(row(page, '虚拟文件 0998.mp4')).toBeVisible()
    await headerBtn(page, HEADER_BTN.view).click()
    await expect(list).toHaveAttribute('data-view-type', 'list')

    await page.evaluate(() => location.hash = '#/drive/1001')
    await expect(row(page, '动漫 第01话.mp4')).toBeVisible()
    await page.goBack()
    await expect(row(page, '虚拟文件 0998.mp4')).toBeVisible()

    await page.keyboard.press('Meta+a')
    await expect(page.getByTitle('退出多选')).toContainText('1000 项')

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
