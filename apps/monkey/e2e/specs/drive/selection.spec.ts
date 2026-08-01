import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { boot, menu, row, rows, watch } from './helpers'

/** 勾选某行的复选框 */
async function check(page: Page, name: string) {
  await row(page, name).locator('input[type="checkbox"]').click()
}

test.describe('选择与操作', () => {
  test('分页器与 ActionBar 交叉切换时保持视觉连续', async ({ page }) => {
    const errors = watch(page)
    await boot(page, { storage: { '115Master_pageSize': '30' } })
    await expect(page.getByRole('button', { name: '下一页' })).toBeVisible()
    await expect.poll(() => page.locator('.drive-bottom-dock').evaluate((dock) => {
      const surface = dock.querySelector<HTMLElement>('.drive-bottom-surface') ?? dock
      return Number.parseFloat(getComputedStyle(surface.firstElementChild!).opacity)
    })).toBe(1)

    async function sample(selector: string) {
      return page.evaluate(async (selector) => {
        const dock = document.querySelector<HTMLElement>('.drive-bottom-dock')!
        const surface = dock.querySelector<HTMLElement>('.drive-bottom-surface') ?? dock
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

    const traces = [await sample('[data-selection-key] input[type="checkbox"]')]
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
