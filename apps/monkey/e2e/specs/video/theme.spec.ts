import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { MASTER_URL } from '../../support'
import { EPISODES, gmStore, setupVideo, videoUrl, watch } from './support'

async function contrast(target: Locator) {
  return target.evaluate((element) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3))
        .map(channel => channel / 255)
        .map(channel => channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4)
        .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0)
    }
    const values = [
      luminance(getComputedStyle(element).color),
      luminance(getComputedStyle(element.parentElement!).backgroundColor),
    ].sort((a, b) => b - a)
    return (values[0] + 0.05) / (values[1] + 0.05)
  })
}

/** 主题与设置：gmValues 驱动 data-theme、设置项切换持久化 */
test.describe('主题与设置', () => {
  test('gmValues.USER_SETTINGS.theme=light → data-theme=light', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'light' } } })
    await page.goto(videoUrl(EPISODES[0].pc))

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'light')
    expect(errors).toEqual([])
  })

  test('gmValues.USER_SETTINGS.theme=dark → data-theme=dark', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'dark' } } })
    await page.goto(videoUrl(EPISODES[0].pc))

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'dark')
    await expect.poll(() => page.evaluate(() => ({
      app: getComputedStyle(document.querySelector('#my-app')!).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      html: getComputedStyle(document.documentElement).backgroundColor,
    }))).toEqual({
      app: 'rgb(0, 0, 0)',
      body: 'rgb(0, 0, 0)',
      html: 'rgb(0, 0, 0)',
    })
    expect(errors).toEqual([])
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`${theme} 主题下播放/暂停动画前景色适配黑色视频底色`, async ({ page }) => {
      await setupVideo(page, {
        download: true,
        gmValues: { USER_SETTINGS: { theme } },
      })
      await page.goto(videoUrl(EPISODES[0].pc))

      const video = page.locator('video')
      const animation = page.locator('div.absolute.inset-0.m-auto.size-20.rounded-full')
      await video.waitFor({ state: 'attached' })
      await video.dispatchEvent('canplay')
      await expect(animation).toBeVisible()

      await video.dispatchEvent('play')
      await expect(animation).toHaveClass(/animate-\[fadeOut_350ms/)
      expect(await contrast(animation)).toBeGreaterThanOrEqual(3)

      await expect(animation).toBeHidden()
      await video.dispatchEvent('pause')
      await expect(animation).toHaveClass(/animate-\[fadeOut_350ms/)
      expect(await contrast(animation)).toBeGreaterThanOrEqual(3)
    })
  }

  test('theme=system 跟随系统配色', async ({ page }) => {
    const errors = watch(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'system' } } })
    await page.goto(videoUrl(EPISODES[0].pc))

    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'dark')
    expect(errors).toEqual([])

    // 系统配色变化时跟随（matchMedia change 监听）
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'light')
    expect(errors).toEqual([])
  })

  test('偏好设置中切换主题持久化到 GM_setValue，刷新后保留', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'light' } } })
    await page.goto(MASTER_URL)

    // 网盘页侧边栏 → 偏好设置对话框（桌面/移动两个 Sider 各有一份按钮，取可见的）
    await page.locator('button[title="偏好设置"]:visible').click()
    const dialog = page.getByRole('dialog', { name: '偏好设置' })
    await expect(dialog.getByRole('heading', { name: '偏好设置' })).toBeVisible()
    await expect(dialog).toHaveAttribute('data-ui-dialog-size', 'lg')

    // 切换为深色：data-theme 立即生效，GM 值持久化
    await dialog.getByRole('radio', { name: '深色' }).click()
    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'dark')
    await expect(dialog.getByRole('radio', { name: '深色' })).toHaveAttribute('aria-checked', 'true')
    const store = await gmStore(page)
    expect((store.USER_SETTINGS as { theme?: string } | undefined)?.theme).toBe('dark')

    // 刷新后从 GM 存储恢复
    await page.reload()
    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'dark')
    expect(errors).toEqual([])
  })

  test('移动菜单支持 Escape/蒙层关闭，并在真实 closed 后交接给偏好 Drawer', async ({ page }) => {
    const errors = watch(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'light' } } })
    await page.goto(MASTER_URL)

    const menu = page.getByRole('button', { name: '打开菜单' })
    const sider = page.locator('[data-ui-mobile-sider]')
    const menuDrawer = page.locator('dialog[aria-label="导航菜单"]')

    await menu.click()
    await expect(menuDrawer).toHaveAttribute('open', '')
    await expect(sider).toHaveClass(/\bui-scrollbar\b/)
    await expect(sider).toHaveClass(/\bui-scrollbar-md\b/)
    await page.keyboard.press('Escape')
    await expect(menuDrawer).not.toHaveAttribute('open')
    await expect(menu).toBeFocused()

    await menu.click()
    await page.mouse.click(8, 8)
    await expect(menuDrawer).not.toHaveAttribute('open')
    await expect(menu).toBeFocused()

    await menu.click()
    const trigger = page.locator('button[title="偏好设置"]:visible')
    await trigger.click()

    const dialog = page.locator('dialog.ui-drawer').filter({
      has: page.locator('[data-ui-navigation-stack]'),
    })
    const panel = dialog.locator('[data-ui-drawer-panel]')
    const stack = dialog.locator('[data-ui-navigation-stack]')
    const handle = dialog.locator('[data-ui-drawer-drag-handle]')
    await expect(page.getByRole('dialog', { name: '偏好设置' })).toBeVisible()
    await expect(dialog.getByRole('heading', { name: '偏好设置' })).toBeVisible()
    await expect(dialog).toHaveClass(/\bui-drawer\b/)
    await expect(dialog).toHaveAttribute('data-ui-drawer-placement', 'bottom')
    await expect(handle).toBeVisible()
    await expect(menuDrawer).not.toHaveAttribute('open')
    await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')

    const bounds = await panel.boundingBox()

    if (!bounds)
      throw new Error('Navigation Sheet did not expose measurable bounds.')
    expect(bounds.x).toBe(0)
    expect(bounds.width).toBe(390)
    expect(bounds.y + bounds.height).toBe(844)
    expect(bounds.height).toBeLessThanOrEqual(633)
    await expect(panel).toHaveCSS('border-top-left-radius', '32px')
    await expect(panel).toHaveCSS('border-bottom-left-radius', '0px')

    await dialog.getByRole('button', { name: '外观' }).click()
    await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'forward')
    await expect(page.getByRole('dialog', { name: '外观' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '外观' })).toBeVisible()
    const scrollOwner = dialog.locator('.ui-navigation-stack__content')
    await expect(scrollOwner).toHaveCount(1)
    await expect(scrollOwner).toHaveCSS('overflow-y', 'auto')
    await expect(scrollOwner.locator('[class~="overflow-y-auto"]')).toHaveCount(0)

    await page.getByRole('button', { name: '返回偏好设置' }).click()
    await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'back')
    await expect(page.getByRole('dialog', { name: '偏好设置' })).toBeVisible()

    const grip = await handle.boundingBox()

    if (!grip)
      throw new Error('Navigation Sheet drag handle did not expose measurable bounds.')
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2 + 160, { steps: 5 })
    await page.mouse.up()
    await expect(dialog).toBeHidden()
    await expect(menu).toBeFocused()
    expect(errors).toEqual([])
  })
})
