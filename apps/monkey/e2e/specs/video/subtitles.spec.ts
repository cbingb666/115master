import { expect, test } from '@playwright/test'
import { EPISODES, setupVideo, showControls, videoUrl, watch } from './support'

/** 字幕：搜索结果入菜单、选择后轨道加载、关闭字幕 */
test.describe('字幕', () => {
  test('字幕菜单列出搜索结果，选择后展示字幕文本', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { download: true, subtitles: true })
    await page.goto(videoUrl(EPISODES[0].pc))
    await showControls(page)

    /** thunder 返回两条结果 → 字幕按钮可用（subtitlecat 无番号、115 内嵌为空） */
    const button = page.locator('button[title^="字幕"]')
    await expect(button).toBeEnabled()
    await button.click()

    /** 菜单：关闭字幕 + 两条搜索结果（label 为去扩展名标题） */
    const menu = page.locator('.x-popup').filter({ has: page.getByText('关闭字幕') })
    await expect(menu.getByText('关闭字幕')).toBeVisible()
    await expect(menu.locator('a[title="剧集 第01集.chs"]')).toBeVisible()
    await expect(menu.locator('a[title="剧集 第01集.eng"]')).toBeVisible()

    // 选择中文字幕：菜单关闭，字幕容器与首条 cue 文本展示（当前时间 0s 命中 0-4s cue）
    await menu.locator('a[title="剧集 第01集.chs"]').click({ position: { x: 20, y: 10 } })
    await expect(menu).toBeHidden()
    await expect(page.getByText('第一行字幕')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('选择「关闭字幕」后字幕隐藏', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { download: true, subtitles: true })
    await page.goto(videoUrl(EPISODES[0].pc))
    await showControls(page)

    const button = page.locator('button[title^="字幕"]')
    await expect(button).toBeEnabled()
    await button.click()
    const menu = page.locator('.x-popup').filter({ has: page.getByText('关闭字幕') })
    await menu.locator('a[title="剧集 第01集.eng"]').click({ position: { x: 20, y: 10 } })
    await expect(page.getByText('第一行字幕')).toBeVisible()

    // 控制栏可能已自动隐藏，重新悬停后再打开菜单选择关闭
    await showControls(page)
    await button.click()
    await menu.getByText('关闭字幕').click()
    await expect(page.getByText('第一行字幕')).toBeHidden()
    expect(errors).toEqual([])
  })
})
