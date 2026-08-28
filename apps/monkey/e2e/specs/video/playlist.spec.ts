import { expect, test } from '@playwright/test'
import { EPISODES, setupVideo, showControls, sider, videoUrl, watch } from './support'

/** 播放列表：侧边栏渲染、点击切换、上一集/下一集 */
test.describe('播放列表', () => {
  test('小屏使用底部 Drawer，sm 起切换为右侧 Drawer', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    await page.locator('[data-app-playlist-trigger]').click()
    const drawer = sider(page)
    const panel = drawer.locator('[data-ui-drawer-panel]')
    const handle = drawer.locator('[data-ui-drawer-drag-handle]')
    const header = drawer.locator('[data-app-playlist-header]')
    const cover = drawer.locator('.aspect-video').first()

    for (const width of [390, 639]) {
      await page.setViewportSize({ width, height: 900 })
      await expect(drawer).toHaveAttribute('data-ui-drawer-placement', 'bottom')
      await expect(handle).toBeVisible()
      await expect.poll(async () => {
        const box = await panel.boundingBox()
        return box && {
          bottom: Math.round(box.y + box.height),
          height: Math.round(box.height),
          width: Math.round(box.width),
        }
      }).toEqual({ bottom: 900, height: 512, width })
      await expect(drawer).toHaveAttribute('data-ui-drawer-overlay-handle', '')
      await expect.poll(async () => {
        const [panelBox, handleBox, headerBox] = await Promise.all([
          panel.boundingBox(),
          handle.boundingBox(),
          header.boundingBox(),
        ])
        if (!panelBox || !handleBox || !headerBox)
          return null
        return {
          handleHeight: Math.round(handleBox.height),
          handleInset: Math.round(handleBox.y - panelBox.y),
          headerHeight: Math.round(headerBox.height),
          headerOffset: Math.round(headerBox.y - handleBox.y),
        }
      }).toEqual({
        handleHeight: 20,
        handleInset: 1,
        headerHeight: 84,
        headerOffset: 0,
      })
    }

    await expect.poll(async () => Math.round((await cover.boundingBox())?.width ?? 0)).toBe(160)

    for (const width of [640, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await expect(drawer).toHaveAttribute('data-ui-drawer-placement', 'end')
      await expect(handle).toHaveCount(0)
      await expect.poll(async () => {
        const box = await panel.boundingBox()
        return box && {
          height: Math.round(box.height),
          right: Math.round(box.x + box.width),
          width: Math.round(box.width),
        }
      }).toEqual({ height: 900, right: width, width: 512 })
    }

    await expect.poll(async () => Math.round((await cover.boundingBox())?.width ?? 0)).toBe(200)
    await expect(drawer).toHaveCount(1)
    await expect(drawer).toHaveAttribute('open', '')
    expect(errors).toEqual([])
  })

  test('Drawer 覆盖播放器、渲染列表，并在 Escape 后恢复触发焦点', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    const player = page.locator('[data-app-video-player]')
    const trigger = page.locator('[data-app-playlist-trigger]')
    const before = await player.boundingBox()

    if (!before)
      throw new Error('播放器缺少可测量几何。')

    await expect(sider(page)).not.toHaveAttribute('open')
    await trigger.click()
    await expect(sider(page)).toHaveAttribute('open', '')
    // Drawer 独占模态 Surface，播放列表内容不得再嵌套玻璃面板。
    await expect(sider(page).locator('.ui-glass-panel')).toHaveCount(1)
    await expect(sider(page).locator('.ui-scrollbar.ui-scrollbar-md.overflow-y-auto')).toHaveCount(1)

    const panel = sider(page).locator('[data-ui-drawer-panel]')
    await expect.poll(async () => {
      const box = await panel.boundingBox()
      return box ? Math.round(box.x + box.width) : null
    }).toBe(Math.round(before.x + before.width))

    const after = await player.boundingBox()
    const box = await panel.boundingBox()

    if (!after || !box)
      throw new Error('播放列表 Drawer 缺少可测量几何。')
    expect(after).toEqual(before)
    expect(box.x).toBeLessThan(before.x + before.width)

    // 3 集全部渲染，计数正确
    await expect(sider(page).getByText('(3)')).toBeVisible()
    for (const ep of EPISODES)
      await expect(sider(page).getByText(ep.n)).toBeVisible()
    // 当前集标题高亮（text-primary）
    await expect(sider(page).locator('.text-primary')).toHaveText(EPISODES[0].n)
    // Drawer 打开期间保留触发器，跨过控制栏自动隐藏阈值后仍可恢复焦点
    await page.waitForTimeout(1_100)
    await expect(trigger).toBeAttached()
    await page.keyboard.press('Escape')
    await expect(sider(page)).not.toHaveAttribute('open')
    await expect(trigger).toBeFocused()
    expect(errors).toEqual([])
  })

  test('点击列表项切换视频并发出正确请求', async ({ page }) => {
    const errors = watch(page)
    const { requested } = await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    await page.locator('[data-app-playlist-trigger]').click()
    await sider(page).getByText(EPISODES[1].n).click()

    // hash 路由切换 → 重新请求第 2 集的文件信息（文档标题随数据更新，不受控制栏自动隐藏影响）
    await expect(page).toHaveURL(new RegExp(`#/video/${EPISODES[1].pc}$`))
    await expect(page).toHaveTitle(EPISODES[1].n)
    expect(requested).toContain(EPISODES[1].pc)
    // 当前集高亮跟随切换
    await expect(sider(page).locator('.text-primary')).toHaveText(EPISODES[1].n)
    await expect(sider(page)).toHaveAttribute('open', '')
    expect(errors).toEqual([])
  })

  test('上一集/下一集按钮按列表位置禁用并可点击切换', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    const prev = page.locator('button[title^="上一集"]')
    const next = page.locator('button[title^="下一集"]')
    await showControls(page)

    // 第 1 集：上一集禁用，下一集可用
    await expect(prev).toBeDisabled()
    await expect(next).toBeEnabled()
    await next.click()
    await expect(
      page.locator('[data-app-video-player] .x-popup').filter({ hasText: EPISODES[1].n }),
    ).toHaveCount(0, { timeout: 300 })
    await expect(page).toHaveURL(new RegExp(`#/video/${EPISODES[1].pc}$`))

    // 第 2 集：两者皆可用，继续下一集
    await expect(prev).toBeEnabled()
    await expect(next).toBeEnabled()
    await next.click()
    await expect(page).toHaveURL(new RegExp(`#/video/${EPISODES[2].pc}$`))

    // 第 3 集：下一集禁用
    await expect(next).toBeDisabled()
    await expect(prev).toBeEnabled()

    // 快捷键继续向后切换时仍保留“没有更多”提示
    await page.keyboard.press(']')
    await expect(
      page.locator('[data-app-video-player] .x-popup').filter({ hasText: '没有更多了' }),
    ).toBeVisible()
    expect(errors).toEqual([])
  })

  test('切换视频时唤醒控制层并恢复自动隐藏', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    const next = page.locator('button[title^="下一集"]')
    const player = page.locator('[data-app-video-player] > div')

    // 鼠标离开播放器后，控制层进入隐藏态
    await expect(next).toBeVisible()
    await page.mouse.move(720, 450)
    await page.waitForTimeout(250)
    await player.dispatchEvent('mouseleave')
    await expect(next).toBeHidden({ timeout: 2_000 })

    // 控制层隐藏时通过快捷键切换，切换后应重新显示
    await page.keyboard.press(']')
    await expect(page).toHaveURL(new RegExp(`#/video/${EPISODES[1].pc}$`))
    await expect(next).toBeVisible()

    // 唤醒不会改变原有自动隐藏行为
    await expect(next).toBeHidden({ timeout: 2_000 })
    expect(errors).toEqual([])
  })
})
