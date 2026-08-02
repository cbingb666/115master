import { expect, test } from '@playwright/test'
import { EPISODES, setupVideo, showControls, sider, videoUrl, watch } from './support'

/** 播放列表：侧边栏渲染、点击切换、上一集/下一集 */
test.describe('播放列表', () => {
  test('侧边栏渲染多文件列表并高亮当前集', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    // 默认收起；点击头部「播放列表」按钮展开
    await expect(sider(page)).toHaveAttribute('data-visible', 'false')
    await page.locator('button[title^="播放列表"]').click()
    await expect(sider(page)).toHaveAttribute('data-visible', 'true')
    await expect(sider(page).locator('.ui-scrollbar.ui-scrollbar-md.overflow-y-auto')).toHaveCount(1)

    // 3 集全部渲染，计数正确
    await expect(sider(page).getByText('(3)')).toBeVisible()
    for (const ep of EPISODES)
      await expect(sider(page).getByText(ep.n)).toBeVisible()
    // 当前集标题高亮（text-primary）
    await expect(sider(page).locator('.text-primary')).toHaveText(EPISODES[0].n)
    expect(errors).toEqual([])
  })

  test('点击列表项切换视频并发出正确请求', async ({ page }) => {
    const errors = watch(page)
    const { requested } = await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    await page.locator('button[title^="播放列表"]').click()
    await sider(page).getByText(EPISODES[1].n).click()

    // hash 路由切换 → 重新请求第 2 集的文件信息（文档标题随数据更新，不受控制栏自动隐藏影响）
    await expect(page).toHaveURL(new RegExp(`#/video/${EPISODES[1].pc}$`))
    await expect(page).toHaveTitle(EPISODES[1].n)
    expect(requested).toContain(EPISODES[1].pc)
    // 当前集高亮跟随切换
    await expect(sider(page).locator('.text-primary')).toHaveText(EPISODES[1].n)
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
    await expect(page).toHaveURL(new RegExp(`#/video/${EPISODES[1].pc}$`))

    // 第 2 集：两者皆可用，继续下一集
    await expect(prev).toBeEnabled()
    await expect(next).toBeEnabled()
    await next.click()
    await expect(page).toHaveURL(new RegExp(`#/video/${EPISODES[2].pc}$`))

    // 第 3 集：下一集禁用
    await expect(next).toBeDisabled()
    await expect(prev).toBeEnabled()
    expect(errors).toEqual([])
  })
})
