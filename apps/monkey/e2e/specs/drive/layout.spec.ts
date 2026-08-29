import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { boot, row, watch } from './helpers'

const SMALL = { '115Master_pageSize': '30' }

test('头部沿用侧边栏外边距，文件列表留白为其两倍', async ({ page }) => {
  const errors = watch(page)
  await boot(page)

  const gaps = await page.locator('[data-ui-header-content]').evaluate((header) => {
    const sider = document
      .querySelector<HTMLButtonElement>('button[title="偏好设置"]')!
      .closest<HTMLElement>('.fixed')!
    const list = document.querySelector<HTMLElement>('[aria-label="文件列表"]')!
      .parentElement!
    const button = header.querySelector<HTMLButtonElement>('button.ui-glass-floating')!
    const headerStyle = getComputedStyle(header)
    const listStyle = getComputedStyle(list)

    return {
      headerLeft: Number.parseFloat(headerStyle.paddingLeft),
      headerRight: Number.parseFloat(headerStyle.paddingRight),
      listLeft: Number.parseFloat(listStyle.paddingLeft),
      listRight: Number.parseFloat(listStyle.paddingRight),
      siderLeft: sider.getBoundingClientRect().left,
      siderTop: sider.getBoundingClientRect().top,
      top: button.getBoundingClientRect().top,
    }
  })

  expect(gaps).toEqual({
    headerLeft: 8,
    headerRight: 8,
    listLeft: 16,
    listRight: 16,
    siderLeft: 8,
    siderTop: 8,
    top: 8,
  })
  expect(errors).toEqual([])
})

async function expectEqualEdgeGaps(page: Page, bottomButton: Locator) {
  const topButton = page.locator('[data-ui-header-content] button.ui-glass-floating:visible').first()
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
