import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { boot, row, watch } from './helpers'

const SMALL = { '115Master_pageSize': '30' }

async function expectEqualEdgeGaps(page: Page, bottomButton: Locator) {
  const topButton = page.locator('.header-sticky-effect button.ui-glass-floating:visible').first()
  const bottomSurface = bottomButton.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ui-pill ")][1]')

  await expect(topButton).toBeVisible()
  await expect(bottomSurface).toBeVisible()

  await expect.poll(async () => {
    const [topGap, bottomGap] = await Promise.all([
      topButton.evaluate(element => element.getBoundingClientRect().top),
      bottomSurface.evaluate(element => window.innerHeight - element.getBoundingClientRect().bottom),
    ])

    return Math.abs(topGap - bottomGap)
  }).toBeLessThanOrEqual(1)
}

test('头部浮动按钮与底部浮动控件到视口边缘距离一致', async ({ page }) => {
  const errors = watch(page)
  await boot(page, { storage: SMALL })

  await expectEqualEdgeGaps(page, page.getByRole('button', { name: '下一页' }))

  const dock = page.locator('.drive-bottom-dock')
  await expect(dock).toBeVisible()
  const backdrop = await dock.evaluate((element) => {
    const style = getComputedStyle(element, '::before')
    const rect = element.getBoundingClientRect()
    return {
      background: style.backgroundImage,
      bottom: rect.bottom - Number.parseFloat(style.bottom),
      pointerEvents: style.pointerEvents,
    }
  })
  expect(backdrop.background).toContain('linear-gradient(to top')
  expect(backdrop.bottom).toBeCloseTo(page.viewportSize()!.height)
  expect(backdrop.pointerEvents).toBe('none')

  await row(page, '演示视频 01.mp4').locator('input[type="checkbox"]').evaluate(input => input.click())
  await expectEqualEdgeGaps(page, page.getByRole('button', { name: '置顶', exact: true }))

  expect(errors).toEqual([])
})
