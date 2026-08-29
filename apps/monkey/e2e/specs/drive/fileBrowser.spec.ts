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

  const picker = page.getByRole('dialog', { name: '保存到' })
  await expect(picker).toBeVisible()
  await expect(picker.getByRole('list', { name: '文件列表' })).toBeVisible()
  await expect(picker.getByRole('button', { name: '保存到此目录' })).toBeVisible()
  return picker
}

async function closePicker(page: Parameters<typeof boot>[0]) {
  const picker = page.getByRole('dialog', { name: '保存到' })
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
    const title = picker.getByRole('heading', { name: '保存到' })
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

  test('内容不足一屏时不产生垂直滚动', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    await picker.locator('button').nth(0).click()
    await picker.getByPlaceholder('搜索目录').fill('演示视频 01.mp4')
    await expect(picker.locator('[data-file-list-total="1"]')).toBeVisible()

    const scroll = picker.locator('[data-file-browser-scroll]')
    await expect.poll(() => scroll.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(0)

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('空目录状态在内容区居中', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    await picker.locator('button').nth(0).click()
    await picker.getByPlaceholder('搜索目录').fill('不存在的目录')
    const empty = picker.locator('[data-ui-empty]')
    const content = picker.locator('.file-browser__list')
    await expect(empty).toBeVisible()

    await expect.poll(async () => {
      const contentBox = await content.boundingBox()
      const emptyBox = await empty.boundingBox()
      if (!contentBox || !emptyBox)
        return Number.POSITIVE_INFINITY
      return Math.max(
        Math.abs(emptyBox.x + emptyBox.width / 2 - contentBox.x - contentBox.width / 2),
        Math.abs(emptyBox.y + emptyBox.height / 2 - contentBox.y - contentBox.height / 2),
      )
    }).toBeLessThanOrEqual(1)

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('列表和卡片顶部第一项保留 16px 间距', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const header = picker.locator('.file-browser__header')
    const first = picker.locator('[data-file-list-index="0"]')
    const path = picker.locator('[data-file-browser-path]')
    const scroll = picker.locator('[data-file-browser-scroll]')
    await scroll.evaluate((element) => {
      element.scrollTop = 0
    })
    await expect(first).toBeVisible()

    const ratio = async () => {
      const firstBox = await first.boundingBox()
      const pathBox = await path.boundingBox()
      const fade = await header.evaluate(element => Math.abs(Number.parseFloat(getComputedStyle(element, '::before').bottom)))
      if (!firstBox || !pathBox)
        return Number.POSITIVE_INFINITY
      return (firstBox.y - pathBox.y - pathBox.height) / fade
    }

    await expect.poll(ratio).toBeCloseTo(0.25, 2)
    await picker.locator('button').nth(4).click()
    await expect(scroll.locator(':scope > [data-view-type="card"]')).toBeVisible()
    await expect(first).toBeVisible()
    await expect.poll(ratio).toBeCloseTo(0.25, 2)

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('底部最后一项留白避开操作栏渐变', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const actions = picker.locator('.ui-dialog__actions')
    const last = picker.locator('[data-file-list-index="19"]')
    const scroll = picker.locator('[data-file-browser-scroll]')
    await scroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect(last).toBeVisible()

    await expect.poll(async () => {
      const actionsBox = await actions.boundingBox()
      const lastBox = await last.boundingBox()
      const fade = await actions.evaluate(element => Math.abs(Number.parseFloat(getComputedStyle(element, '::before').top)))
      if (!actionsBox || !lastBox)
        return Number.NEGATIVE_INFINITY
      return actionsBox.y - fade - lastBox.y - lastBox.height
    }).toBeGreaterThanOrEqual(-1)

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

  test('桌面分页器嵌入弹窗底部并使用 glass-floating 材质', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const scroll = picker.locator('[data-file-browser-scroll]')
    const actions = picker.locator('.ui-dialog__actions')
    const pagination = actions.locator('[data-file-browser-pagination]')
    const surface = pagination.locator('.ui-glass-floating')
    const cancel = actions.getByRole('button', { name: '取消' })
    const confirm = actions.getByRole('button', { name: '保存到此目录' })

    await expect(pagination.locator('[data-ui-pagination]')).toBeVisible()
    await expect(surface).toBeVisible()
    await expect(surface).toHaveCSS('padding-top', '4px')
    await expect(cancel).toHaveClass(/ui-glass-floating/)
    await expect(confirm).toHaveClass(/ui-glass-floating/)
    await expect(pagination.getByRole('button', { name: '下一页' })).toHaveClass(/btn-sm/)
    await expect(scroll.locator('[data-file-browser-pagination]')).toHaveCount(0)
    await expect.poll(async () => {
      const actionsBox = await actions.boundingBox()
      const paginationBox = await pagination.boundingBox()
      const cancelBox = await cancel.boundingBox()
      const confirmBox = await confirm.boundingBox()
      if (!actionsBox || !paginationBox || !cancelBox || !confirmBox)
        return Number.POSITIVE_INFINITY
      const centerX = paginationBox.x + paginationBox.width / 2
      const centerY = paginationBox.y + paginationBox.height / 2
      return Math.max(
        Math.abs(centerX - actionsBox.x - actionsBox.width / 2),
        Math.abs(centerY - cancelBox.y - cancelBox.height / 2),
        Math.abs(centerY - confirmBox.y - confirmBox.height / 2),
      )
    }).toBeLessThanOrEqual(1)

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('移动端分页器居中位于操作按钮上方', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)
    await page.evaluate(() => localStorage.setItem('115Master_file_browser_view_type', 'card'))

    const picker = await openPicker(page)
    await page.setViewportSize({ width: 390, height: 844 })
    const actions = picker.locator('.ui-dialog__actions')
    const pagination = actions.locator('[data-file-browser-pagination]')
    const surface = pagination.locator('.ui-glass-floating')
    const cancel = actions.getByRole('button', { name: '取消' })
    const confirm = actions.getByRole('button', { name: '保存到此目录' })

    await expect(pagination.locator('[data-ui-pagination]')).toBeVisible()
    await expect(surface).toBeVisible()
    await expect(pagination.getByRole('button', { name: '下一页' })).toHaveClass(/btn-sm/)
    await expect(picker.locator('[data-file-browser-scroll] [data-file-browser-pagination]')).toHaveCount(0)
    await expect.poll(async () => {
      const actionsBox = await actions.boundingBox()
      const surfaceBox = await surface.boundingBox()
      if (!actionsBox || !surfaceBox)
        return Number.POSITIVE_INFINITY
      return surfaceBox.width / actionsBox.width
    }).toBeLessThanOrEqual(0.5)
    await expect.poll(async () => {
      const actionsBox = await actions.boundingBox()
      const surfaceBox = await surface.boundingBox()
      if (!actionsBox || !surfaceBox)
        return Number.POSITIVE_INFINITY
      return Math.abs(
        surfaceBox.x + surfaceBox.width / 2 - actionsBox.x - actionsBox.width / 2,
      )
    }).toBeLessThanOrEqual(1)
    await expect.poll(async () => {
      const surfaceBox = await surface.boundingBox()
      const cancelBox = await cancel.boundingBox()
      const confirmBox = await confirm.boundingBox()
      if (!surfaceBox || !cancelBox || !confirmBox)
        return Number.NEGATIVE_INFINITY
      return Math.min(cancelBox.y, confirmBox.y) - surfaceBox.y - surfaceBox.height
    }).toBeGreaterThanOrEqual(8)
    await expect.poll(async () => {
      const cancelBox = await cancel.boundingBox()
      const confirmBox = await confirm.boundingBox()
      if (!cancelBox || !confirmBox)
        return Number.POSITIVE_INFINITY
      return Math.abs(
        cancelBox.y + cancelBox.height / 2 - confirmBox.y - confirmBox.height / 2,
      )
    }).toBeLessThanOrEqual(1)
    await expect.poll(async () => {
      const cancelBox = await cancel.boundingBox()
      const confirmBox = await confirm.boundingBox()
      if (!cancelBox || !confirmBox)
        return Number.POSITIVE_INFINITY
      return Math.abs(cancelBox.width - confirmBox.width)
    }).toBeLessThanOrEqual(1)
    await expect.poll(async () => {
      const paginationBox = await surface.boundingBox()
      const buttonBoxes = await Promise.all([cancel.boundingBox(), confirm.boundingBox()])
      if (!paginationBox || buttonBoxes.some(box => !box))
        return Number.POSITIVE_INFINITY

      return Math.max(...buttonBoxes.map((box) => {
        if (!box)
          return Number.POSITIVE_INFINITY
        return Math.max(
          0,
          Math.min(paginationBox.x + paginationBox.width, box.x + box.width)
          - Math.max(paginationBox.x, box.x),
        ) * Math.max(
          0,
          Math.min(paginationBox.y + paginationBox.height, box.y + box.height)
          - Math.max(paginationBox.y, box.y),
        )
      }))
    }).toBe(0)

    const scroll = picker.locator('[data-file-browser-scroll]')
    const last = picker.locator('[data-file-list-index="19"]')
    await scroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect(last).toBeVisible()
    await expect.poll(async () => {
      const actionsBox = await actions.boundingBox()
      const lastBox = await last.boundingBox()
      const fade = await actions.evaluate(element => Math.abs(Number.parseFloat(getComputedStyle(element, '::before').top)))
      if (!actionsBox || !lastBox)
        return Number.NEGATIVE_INFINITY
      return actionsBox.y - fade - lastBox.y - lastBox.height
    }).toBeGreaterThanOrEqual(-1)
    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('滚动内容穿透沉浸式头部和底部', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const header = picker.locator('.file-browser__header')
    const scroll = picker.locator('[data-file-browser-scroll]')
    const actions = picker.locator('.ui-dialog__actions')

    await scroll.evaluate((element) => {
      element.scrollTop = 96
    })

    await expect.poll(async () => {
      const headerBox = await header.boundingBox()
      const scrollBox = await scroll.boundingBox()
      if (!headerBox || !scrollBox)
        return Number.POSITIVE_INFINITY
      return Math.abs(scrollBox.y - headerBox.y)
    }).toBeLessThanOrEqual(1)
    await expect.poll(async () => {
      const scrollBox = await scroll.boundingBox()
      const actionsBox = await actions.boundingBox()
      if (!scrollBox || !actionsBox)
        return Number.NEGATIVE_INFINITY
      return scrollBox.y + scrollBox.height - actionsBox.y - actionsBox.height
    }).toBeGreaterThanOrEqual(-1)

    await closePicker(page)
    expect(errors).toEqual([])
  })

  test('底部渐变不覆盖滚动条', async ({ page }) => {
    const errors = watch(page)
    await bootWithOffline(page)

    const picker = await openPicker(page)
    const scroll = picker.locator('[data-file-browser-scroll]')
    const actions = picker.locator('.ui-dialog__actions')

    await expect.poll(async () => {
      const scrollBox = await scroll.boundingBox()
      const actionsBox = await actions.boundingBox()
      const styles = await actions.evaluate((element) => {
        const scroll = element.parentElement?.querySelector<HTMLElement>('[data-file-browser-scroll]')
        return {
          right: Number.parseFloat(getComputedStyle(element, '::before').right),
          scrollbar: scroll
            ? Number.parseFloat(getComputedStyle(scroll).getPropertyValue('--ui-scrollbar-size'))
            : Number.NaN,
        }
      })
      if (!scrollBox || !actionsBox || !Number.isFinite(styles.right) || !Number.isFinite(styles.scrollbar))
        return Number.POSITIVE_INFINITY
      return actionsBox.x + actionsBox.width - styles.right
        - (scrollBox.x + scrollBox.width - styles.scrollbar)
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
