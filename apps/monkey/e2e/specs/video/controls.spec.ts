import { expect, test } from '@playwright/test'
import { EPISODES, setupVideo, showControls, sider, videoUrl, watch } from './support'

/** 控制栏：控件存在性与交互、设置菜单、快捷键（不断言真实解码） */
test.describe('控制栏', () => {
  test('核心控件齐全，无可用源时播放/音量/倍速禁用', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))
    await showControls(page)

    // canplay=false 时的禁用态（以代码实际行为为准）
    await expect(page.locator('button[title^="播放/暂停"]')).toBeDisabled()
    await expect(page.locator('button[title^="静音"]')).toBeDisabled()
    await expect(page.locator('button[title^="倍速"]')).toBeDisabled()
    // 无字幕结果时字幕按钮禁用并提示
    await expect(page.locator('button[title="未找到字幕"]')).toBeDisabled()
    // 与解码无关的控件可用
    await expect(page.locator('button[title^="画质"]')).toBeEnabled()
    await expect(page.locator('button[title^="全屏"]')).toBeEnabled()
    await expect(page.locator('button[title^="画中画"]')).toBeEnabled()
    await expect(page.locator('button[title^="播放列表"]')).toBeEnabled()
    expect(errors).toEqual([])
  })

  test('全屏按钮与快捷键 f 切换全屏', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))
    await showControls(page)

    await page.locator('button[title^="全屏"]').click()
    await page.waitForFunction(() => !!document.fullscreenElement)
    // 快捷键 f 退出全屏
    await page.keyboard.press('f')
    await page.waitForFunction(() => !document.fullscreenElement)
    expect(errors).toEqual([])
  })

  test('画质菜单列出可用源并可选中', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { download: true })
    await page.goto(videoUrl(EPISODES[0].pc))
    await showControls(page)

    /** Ultra 源被选中后按钮显示对应文案 */
    const quality = page.locator('button[title^="画质"]')
    await expect(quality).toHaveText('Ultra')
    await quality.click()

    /** 菜单列出唯一可用源并标记为当前（弹层常驻 DOM，取可见的） */
    const menu = page.locator('.x-popup:visible')
    await expect(menu.locator('li')).toHaveCount(1)
    await expect(menu.locator('li a').first()).toHaveText('Ultra')
    await menu.locator('li a').first().click()
    await expect(menu).toBeHidden()
    expect(errors).toEqual([])
  })

  test('右键打开偏好设置，切换自动播放持久化到 localStorage', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    // 右键播放器遮罩 → 上下文菜单 → 偏好设置（弹层常驻 DOM，取可见的）
    await page.mouse.click(720, 450, { button: 'right' })
    const menu = page.locator('.x-popup:visible')
    await menu.getByText('偏好设置', { exact: true }).click()

    /** 设置弹窗：播放/快捷键两个标签页 */
    const settings = page.locator('.x-popup').filter({
      has: page.getByRole('heading', { name: '偏好设置' }),
    })
    await expect(settings).toBeVisible()
    await expect(settings).toHaveClass(/\bui-scrollbar-md\b/)
    await expect(settings.getByRole('tab', { name: '播放' })).toBeVisible()
    await settings.getByRole('tab', { name: '快捷键' }).click()
    await expect(settings.getByText('播放/暂停', { exact: true })).toBeVisible()
    await settings.getByRole('tab', { name: '播放' }).click()

    /** 自动播放默认开启；关闭后写入 x-player-preferences */
    const row = settings.getByText('自动播放', { exact: true }).locator('..')
    const toggle = row.locator('input[type="checkbox"]')
    await expect(toggle).toBeChecked()
    await toggle.click()
    await expect(toggle).not.toBeChecked()
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('x-player-preferences') ?? '{}'))
    expect(stored.autoPlay).toBe(false)
    expect(errors).toEqual([])
  })

  test('播放器信息弹层使用沉浸式滚动条', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    await page.mouse.click(720, 450, { button: 'right' })
    await page.locator('.x-popup:visible').getByText('Statistics', { exact: true }).click()
    const statistics = page.locator('.x-popup').filter({
      has: page.getByRole('heading', { name: 'Statistics' }),
    })
    await expect(statistics).toBeVisible()
    await expect(statistics.locator('.ui-scrollbar.ui-scrollbar-md.overflow-y-auto')).toHaveCount(1)
    await statistics.getByRole('button').click()
    await expect(statistics).toBeHidden()

    await page.mouse.click(720, 450, { button: 'right' })
    await page.locator('.x-popup:visible').getByText('关于', { exact: true }).click()
    const about = page.locator('.x-popup').filter({
      has: page.getByRole('heading', { name: '关于' }),
    })
    await expect(about).toBeVisible()
    await expect(about.locator('.ui-scrollbar.ui-scrollbar-md.overflow-y-auto')).toHaveCount(1)
    expect(errors).toEqual([])
  })

  test('快捷键 \\ 切换播放列表侧边栏', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    await expect(sider(page)).toHaveAttribute('data-visible', 'false')
    await page.keyboard.press('Backslash')
    await expect(sider(page)).toHaveAttribute('data-visible', 'true')
    await page.keyboard.press('Backslash')
    await expect(sider(page)).toHaveAttribute('data-visible', 'false')
    expect(errors).toEqual([])
  })
})
