import { expect, test } from '@playwright/test'
import { MASTER_URL } from '../../support'
import { EPISODES, setupVideo, watch } from './support'

/** 旧播放页重定向：/master/video/?pick_code=xxx → /master/#/video/xxx */
test.describe('旧播放页重定向', () => {
  test('访问旧 URL 形态落到新 hash 路由并加载视频页', async ({ page }) => {
    const errors = watch(page)
    await setupVideo(page)
    await page.goto(`${MASTER_URL}video/?pick_code=${EPISODES[0].pc}`)

    // router.ts legacyRedirect 在挂载前 replaceState 到新路由
    await expect(page).toHaveURL(new RegExp(`/master/#/video/${EPISODES[0].pc}$`))
    await expect(page.getByText(EPISODES[0].n.toUpperCase(), { exact: true })).toBeVisible()
    await expect(page.locator('button[title^="播放/暂停"]')).toBeAttached()
    expect(errors).toEqual([])
  })
})
