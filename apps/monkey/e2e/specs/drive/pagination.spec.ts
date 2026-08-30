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

  test('页大小菜单：选项横向填满菜单内容区', async ({ page }) => {
    const errors = watch(page)
    await boot(page, { storage: { '115Master_pageSize': '1000' } })

    await headerBtn(page, HEADER_BTN.pageSize).click()
    const dropdown = menu(page)
    await expect(dropdown).toBeVisible()

    const widths = await dropdown.evaluate((element) => {
      const option = [...element.querySelectorAll<HTMLElement>('a')]
        .find(node => node.textContent?.trim() === '1000')

      if (!option)
        throw new Error('页大小菜单缺少 1000 选项')

      const style = getComputedStyle(element)

      return {
        content: element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight),
        option: option.offsetWidth,
      }
    })

    expect(widths.option).toBeCloseTo(widths.content)
    expect(errors).toEqual([])
  })

  test('窄屏更多菜单：顶层项填满抽屉且页大小子项右对齐', async ({ page }) => {
    const errors = watch(page)
    await page.setViewportSize({ width: 375, height: 812 })
    await boot(page, { storage: { '115Master_pageSize': '1000' } })

    await page.getByRole('button', { name: '更多操作' }).click()
    const sheet = page.getByRole('menu', { name: '更多操作' })
    await expect(sheet).toBeVisible()
    await sheet.getByText('每页', { exact: true }).click()

    const widths = await sheet.evaluate((element) => {
      const top = element.querySelector<HTMLElement>(':scope > li > a')
      const option = [...element.querySelectorAll<HTMLElement>('a')]
        .find(node => node.textContent?.trim() === '1000')
      const surface = element.parentElement

      if (!top || !option || !surface)
        throw new Error('窄屏更多菜单缺少对齐测量项')

      const style = getComputedStyle(element)
      const box = surface.getBoundingClientRect()

      return {
        content: surface.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight),
        optionRight: option.getBoundingClientRect().right,
        sheetRight: box.right - Number.parseFloat(style.paddingRight),
        top: top.offsetWidth,
      }
    })

    expect(widths.top).toBeCloseTo(widths.content)
    expect(widths.optionRight).toBeCloseTo(widths.sheetRight)
    expect(errors).toEqual([])
  })

  test('偏好设置切换为滚动无限加载：逐页追加并隐藏分页器', async ({ page }) => {
    const errors = watch(page)
    const reqs = record(page, FILES_RE)
    await boot(page, { storage: SMALL })

    await page.locator('button[title="偏好设置"]:visible').click()
    const dialog = page.getByRole('dialog', { name: '偏好设置' })
    await dialog.getByRole('button', { name: '文件列表' }).click()
    await dialog.getByLabel('文件列表加载方式').selectOption('infinite')

    expect(await page.evaluate(() => localStorage.getItem('115Master_drive_list_load_mode'))).toBe('infinite')
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '30')
    await expect(page.getByRole('button', { name: '下一页' })).toBeHidden()
    await page.getByRole('button', { name: '关闭偏好设置' }).click()

    await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight))
    await expect.poll(() => reqs.some(r =>
      r.url.searchParams.get('offset') === '30' && r.url.searchParams.get('limit') === '30',
    )).toBe(true)
    await expect(page.getByRole('list', { name: '文件列表' })).toHaveAttribute('data-file-list-total', '43')
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight))
    await expect(row(page, '说明文档.pdf')).toBeVisible()
    await expect(page.getByText('已加载全部 43 项')).toBeVisible()

    expect(errors).toEqual([])
  })
})
