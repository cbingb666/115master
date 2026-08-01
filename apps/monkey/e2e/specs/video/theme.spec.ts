import { expect, test } from '@playwright/test'
import { MASTER_URL } from '../../support'
import { EPISODES, gmStore, setupVideo, videoUrl, watch } from './support'

/** 主题与设置：gmValues 驱动 data-theme、设置项切换持久化 */
test.describe('主题与设置', () => {
  test('gmValues.USER_SETTINGS.theme=light → data-theme=light', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'light' } } })
    await page.goto(videoUrl(EPISODES[0].pc))

    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'light')
    expect(errors).toEqual([])
  })

  test('gmValues.USER_SETTINGS.theme=dark → data-theme=dark', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'dark' } } })
    await page.goto(videoUrl(EPISODES[0].pc))

    await expect(page.locator('#my-app')).toHaveAttribute('data-theme', 'dark')
    expect(errors).toEqual([])
  })

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
    const dialog = page.locator('.ui-dialog')
    await expect(dialog.getByRole('heading', { name: '偏好设置' })).toBeVisible()

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

  test('移动端偏好设置使用全屏导航表面', async ({ page }) => {
    const errors = watch(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await setupVideo(page, { gmValues: { USER_SETTINGS: { theme: 'light' } } })
    await page.goto(MASTER_URL)

    const trigger = page.locator('button[title="偏好设置"]:visible')
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: '偏好设置' })
    const surface = dialog.locator('[data-ui-navigation-surface]')
    await expect(dialog.getByRole('heading', { name: '偏好设置' })).toBeVisible()
    await expect(surface).toHaveCSS('width', '390px')
    await expect(surface).toHaveCSS('height', '844px')

    await dialog.getByRole('button', { name: '外观' }).click()
    await expect(page.getByRole('dialog', { name: '外观' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '外观' })).toBeVisible()

    await page.getByRole('button', { name: '返回偏好设置' }).click()
    await expect(page.getByRole('dialog', { name: '偏好设置' })).toBeVisible()

    await page.getByRole('button', { name: '关闭偏好设置' }).click()
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    expect(errors).toEqual([])
  })
})
