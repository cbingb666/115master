import { expect, test } from '@playwright/test'
import { dirs, HOME_URL, MASTER_URL, setupHarness, watch } from '../support'

test.describe('smoke', () => {
  test('MASTER：SPA 挂载 #my-app 并渲染 mock 文件列表', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(MASTER_URL)

    await expect(page.locator('#my-app')).toBeAttached()
    await expect(page.locator('[data-ui-watermark]')).toHaveCount(0)
    const first = dirs['0'].items.find(i => i.fc === 1)!
    await expect(page.getByText(first.n).first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('HOME：userscript 无 pageerror 运行并注入增强标记', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    // FileItemModExtMenu 向视频项 .file-opr 注入的 Master 播放按钮
    await expect(page.locator('a.master-player').first()).toBeAttached()
    // NavMod 向 .panel-nav 注入的 Master Drive 入口
    await expect(page.locator('a.master-drive-link')).toBeAttached()
    expect(errors).toEqual([])
  })
})
