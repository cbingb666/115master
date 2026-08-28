import { expect, test } from '@playwright/test'
import { setupHarness } from '../../support'
import { EPISODES, installVideoMocks, setupVideo, videoUrl, watch } from './support'

/** 页面装配：外壳挂载、数据驱动 UI、加载与错误态 */
test.describe('视频页装配', () => {
  test('播放器外壳挂载，标题与文件信息来自 mock 数据', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(videoUrl(EPISODES[0].pc))

    // 文档标题与头部文件名来自 files/video mock，多个文件时显示播放序号
    await expect(page).toHaveTitle(EPISODES[0].n)
    await expect(page.locator('[data-app-video-title]')).toHaveText(
      `1/${EPISODES.length} ${EPISODES[0].n.toUpperCase()}`,
    )
    await expect(page.locator('[data-app-video-position]')).toHaveText(`1/${EPISODES.length}`)
    // 面包屑来自播放列表 path（过滤根目录后剩「剧集」）
    await expect(page.getByRole('link', { name: '剧集', exact: true })).toBeVisible()
    // 控制栏核心按钮渲染；默认 mock 无可用视频源（m3u8 未转码、下载失败）→ canplay=false
    await expect(page.locator('button[title^="播放/暂停"]')).toBeDisabled()
    // 未选中任何源时画质按钮显示「自动」
    await expect(page.locator('button[title^="画质"]')).toHaveText('自动')
    expect(errors).toEqual([])
  })

  test('文件信息加载失败时显示错误提示', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page, {
      mocks: (api) => {
        installVideoMocks(api)
        // files/video 返回 500 无效 JSON → r.json() 抛错 → useAsyncState 捕获
        api.override(/^https:\/\/webapi\.115\.com\/files\/video/, async ({ route }) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json; charset=utf-8',
            headers: {
              'access-control-allow-origin': 'https://115.com',
              'access-control-allow-credentials': 'true',
            },
            body: 'Internal Server Error',
          })
          return true
        })
      },
    })
    await page.goto(videoUrl(EPISODES[0].pc))

    // HeaderInfo 错误分支（以代码实际行为为准）
    await expect(page.getByText('获取文件信息失败')).toBeVisible()
    // vueuse useAsyncState 捕获错误后经 reportError 上报（仅这一条，无其他业务报错）
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Drive115Error')
  })

  test('视频源加载失败时显示 LoadingError 并可忽略', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { download: true })
    await page.goto(videoUrl(EPISODES[0].pc))

    /** Ultra 源指向的媒体请求被网络沙箱 abort → 原生内核 error 事件 → LoadingError */
    const close = page.getByRole('button', { name: '忽略错误' })
    await expect(close).toBeVisible()
    // 忽略后错误提示消失，页面其余部分仍可用
    await close.click()
    await expect(close).toBeHidden()
    await expect(page.locator('[data-app-video-title]')).toContainText(
      EPISODES[0].n.toUpperCase(),
    )
    expect(errors).toEqual([])
  })

  test('单文件播放列表的标题不显示序号', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page, { playlistSize: 1 })
    await page.goto(videoUrl(EPISODES[0].pc))

    await expect(page.locator('[data-app-video-title]')).toHaveText(
      EPISODES[0].n.toUpperCase(),
    )
    await expect(page.locator('[data-app-video-position]')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
