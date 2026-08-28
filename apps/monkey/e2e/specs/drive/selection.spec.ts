import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { dirs, FILES_RE, filesRes, json } from '../../support'
import { boot, menu, record, row, rows, watch } from './helpers'

const LABEL_RE = /^https:\/\/webapi\.115\.com\/label\/list/
const MOVE_RE = /^https:\/\/webapi\.115\.com\/files\/move(?:\?|$)/
const MOVE_PROGRESS_RE = /^https:\/\/webapi\.115\.com\/files\/move_progress/

/** 勾选某行的复选框 */
async function check(page: Page, name: string) {
  await row(page, name).locator('input[type="checkbox"]').evaluate(input => input.click())
}

test.describe('选择与操作', () => {
  test('移动两个文件后从服务端重新获取源目录', async ({ page }) => {
    const errors = watch(page)
    const requests = record(page, FILES_RE)
    let moved = false
    await boot(page, {
      mocks: (api) => {
        api.override(FILES_RE, ({ route, url }) => {
          if ((url.searchParams.get('cid') ?? '0') !== '0')
            return
          const root = dirs['0']
          return json(route, filesRes({
            ...root,
            items: moved ? [root.items[0]] : [root.items[0], root.items[2], root.items[3]],
          }, 0, 256))
        })
        api.override(MOVE_RE, ({ route }) => {
          moved = true
          return json(route, { state: true })
        })
        api.override(MOVE_PROGRESS_RE, ({ route }) => json(route, { state: true, progress: 100 }))
      },
    })

    await check(page, '演示视频 01.mp4')
    await check(page, '演示视频 02.mp4')
    await expect(page.getByTitle('退出多选')).toContainText('2 项')
    await page.getByRole('button', { name: '移动' }).click()

    const dialog = page.getByRole('dialog', { name: '移动到' })
    await expect(page).toHaveURL(/fb_cid=0/)
    await dialog.getByRole('listitem').filter({ hasText: '动漫' }).click()
    await expect(page).toHaveURL(/fb_cid=1001/)
    const before = requests.filter(request => request.url.searchParams.get('cid') === '0').length
    await dialog.getByRole('button', { name: '确认' }).click()

    await expect(dialog).toBeHidden()
    await expect.poll(() => (
      requests.filter(request => request.url.searchParams.get('cid') === '0').length
    )).toBeGreaterThan(before)
    await expect(row(page, '动漫')).toBeVisible()
    await expect(row(page, '演示视频 01.mp4')).toHaveCount(0)
    await expect(row(page, '演示视频 02.mp4')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('分页器与 ActionBar 交叉切换时保持视觉连续', async ({ page }) => {
    const errors = watch(page)
    await boot(page, { storage: { '115Master_pageSize': '30' } })
    await expect(page.getByRole('button', { name: '下一页' })).toBeVisible()
    await expect.poll(() => page.locator('.drive-bottom-dock').evaluate((dock) => {
      const surface = dock.querySelector<HTMLElement>('[data-ui-floating-dock]')!
      return Number.parseFloat(getComputedStyle(surface.firstElementChild!).opacity)
    })).toBe(1)

    async function sample(selector: string) {
      return page.evaluate(async (selector) => {
        const dock = document.querySelector<HTMLElement>('.drive-bottom-dock')!
        const surface = dock.querySelector<HTMLElement>('[data-ui-floating-dock]')!
        const source = surface.firstElementChild as HTMLElement
        source.dataset.transitionSource = ''
        document.querySelector<HTMLElement>(selector)!.click()

        const start = performance.now()
        const frames: { count: number, glass: number, offset: number, opacity: number, time: number, travel: number, width: number }[] = []
        while (performance.now() - start < 500) {
          await new Promise(requestAnimationFrame)
          const items = [...surface.children] as HTMLElement[]
          const bounds = surface.getBoundingClientRect()
          frames.push({
            count: items.length,
            glass: dock.querySelectorAll('.ui-glass-floating').length,
            offset: Math.max(...items.map((item) => {
              const box = item.getBoundingClientRect()
              return Math.abs(box.left + box.width / 2 - (bounds.left + bounds.width / 2))
            })),
            opacity: items.reduce((sum, item) => sum + Number.parseFloat(getComputedStyle(item).opacity), 0),
            time: performance.now() - start,
            travel: Math.max(...items.map((item) => {
              const box = item.getBoundingClientRect()
              return Math.abs(box.top + box.height / 2 - (bounds.top + bounds.height / 2))
            })),
            width: bounds.width,
          })

          if (
            frames.at(-1)!.time > 100
            && !surface.querySelector('[data-transition-source]')
            && items.length === 1
            && frames.at(-1)!.opacity > 0.99
          ) {
            break
          }
        }
        return frames
      }, selector)
    }

    const traces = [await sample('[data-ui-collection-selection-key] input[type="checkbox"]')]
    await expect(page.getByRole('button', { name: '置顶', exact: true })).toBeVisible()
    traces.push(await sample('[title="退出多选"]'))
    await expect(page.getByRole('button', { name: '下一页' })).toBeVisible()

    for (const trace of traces) {
      expect(Math.min(...trace.map(frame => frame.opacity))).toBeGreaterThan(0.7)
      expect(trace.some(frame => frame.count === 2)).toBe(true)
      expect(trace.every(frame => frame.glass === 1)).toBe(true)
      expect(Math.max(...trace.filter(frame => frame.count === 2).map(frame => frame.offset))).toBeLessThan(1)
      expect(Math.max(...trace.map(frame => frame.travel))).toBeLessThan(1)
      expect(new Set(trace.map(frame => Math.round(frame.width))).size).toBeGreaterThan(2)
    }
    expect(errors).toEqual([])
  })

  test('单选/多选：SelectionHeader 计数与 ActionBar 状态', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    /** 勾选一项 → 进入多选态：SelectionHeader 显示「1 项」，行标记 data-checked */
    await check(page, '演示视频 01.mp4')
    const exit = page.getByTitle('退出多选')
    await expect(exit).toBeVisible()
    await expect(exit).toContainText('1 项')
    const geometry = await exit.evaluate((button) => {
      const style = getComputedStyle(button)
      return {
        height: button.getBoundingClientRect().height,
        radii: [
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomRightRadius,
          style.borderBottomLeftRadius,
        ].map(Number.parseFloat),
      }
    })
    for (const radius of geometry.radii)
      expect(radius).toBeGreaterThanOrEqual(geometry.height / 2)
    await expect(row(page, '演示视频 01.mp4')).toHaveAttribute('data-checked', 'true')

    /** ActionBar 出现：置顶/星标/打标签/移动/重命名/删除（根目录无「提到上级」） */
    await expect(page.getByRole('button', { name: '置顶', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '星标', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '打标签' })).toBeVisible()
    await expect(page.getByRole('button', { name: '移动' })).toBeVisible()
    await expect(page.getByRole('button', { name: '重命名' })).toBeVisible()
    await expect(page.getByRole('button', { name: '删除' })).toBeVisible()
    await expect(page.getByRole('button', { name: '提到上级' })).toHaveCount(0)

    /** 再勾一项 → 「2 项」 */
    await check(page, '演示视频 02.mp4')
    await expect(exit).toContainText('2 项')

    /** 退出多选 → 普通顶栏恢复（排序按钮再现）、ActionBar 消失 */
    await exit.click()
    await expect(page.getByRole('button', { name: /当前排序/ })).toBeVisible()
    await expect(page.getByRole('button', { name: '置顶', exact: true })).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('全选：Meta+A 选中当前页全部', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    await check(page, '演示视频 01.mp4')
    await page.keyboard.press('Meta+a')
    await expect(page.getByTitle('退出多选')).toContainText('43 项')
    await expect(page.getByTitle('全选')).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('框选到视口底部时自动滚动并选中虚拟长列表', async ({ page }) => {
    const errors = watch(page)
    await boot(page, {
      storage: {
        '115Master_drive_view_type': 'list',
        '115Master_pageSize': '30',
      },
    })

    const first = await rows(page).first().boundingBox()
    expect(first).not.toBeNull()
    const x = first!.x + first!.width * 0.7
    const y = first!.y + first!.height / 2

    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, page.viewportSize()!.height - 56, { steps: 5 })

    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
    await expect(page.getByTitle('退出多选')).toContainText('30 项')
    await page.mouse.up()

    await expect(row(page, '演示视频 28.mp4')).toHaveAttribute('data-checked', 'true')
    expect(errors).toEqual([])
  })

  test('移动与打标签对话框使用沉浸式滚动条', async ({ page }) => {
    const errors = watch(page)
    await boot(page, {
      mocks: api => api.override(LABEL_RE, ({ route }) => json(route, {
        state: true,
        data: {
          total: 2,
          list: [
            { id: '1', name: '电影', color: '#FF4B30' },
            { id: '2', name: '剧集', color: '#2670FC' },
          ],
        },
      })),
    })

    await row(page, '演示视频 01.mp4').click({ button: 'right' })
    await menu(page).getByRole('menuitem', { name: '移动' }).click()
    const move = page.getByRole('dialog', { name: '移动到' })
    await expect(move).toBeVisible()
    await expect(move.locator('.ui-scrollbar.ui-scrollbar-md.overflow-y-auto')).toHaveCount(1)
    await move.getByRole('button', { name: '取消' }).click()

    await page.getByRole('button', { name: '打标签' }).click()
    const tags = page.getByRole('dialog', { name: '打标签' })
    await expect(tags).toBeVisible()
    await expect(tags.locator('.ui-scrollbar.ui-scrollbar-md.overflow-y-auto')).toHaveCount(1)
    await tags.getByRole('button', { name: '取消' }).click()
    expect(errors).toEqual([])
  })

  test('右键菜单：单选该项并弹出 action 菜单', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    await row(page, '演示视频 01.mp4').click({ button: 'right' })

    /** 右键 radio 选中该项 → 多选态计数 1 */
    await expect(page.getByTitle('退出多选')).toContainText('1 项')

    /** 菜单项与 actionConfig 一致（根目录无「提到上级」） */
    const items = menu(page).getByRole('menuitem')
    await expect(items).toHaveText(['置顶', '星标', '打标签', '移动', '重命名', '删除'])

    expect(errors).toEqual([])
  })

  test('子目录右键菜单含「提到上级」', async ({ page }) => {
    const errors = watch(page)
    await boot(page)

    await row(page, '动漫').click()
    await expect(rows(page)).toHaveCount(12)

    await row(page, '动漫 第01话.mp4').click({ button: 'right' })
    const items = menu(page).getByRole('menuitem')
    await expect(items).toHaveText(['置顶', '星标', '打标签', '移动', '提到上级', '重命名', '删除'])

    expect(errors).toEqual([])
  })
})
