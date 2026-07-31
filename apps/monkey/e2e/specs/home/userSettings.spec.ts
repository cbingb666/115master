import { expect, test } from '@playwright/test'
import { HOME_URL, setupHarness } from '../../support'
import { gmStore, watch } from '../../support/homeUtils'

/**
 * userSettings 开关：enableFilelistPreview 绑定 FileItemModVideoCover
 * （FileItemModBase.ENABLE_KEY_IN_USER_SETTING 机制：开关变化自动 onLoad/onDestroy）
 */
test.describe('userSettings 开关', () => {
  test('enableFilelistPreview=false：不注入视频封面，开关无 active', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page, {
      gmValues: { USER_SETTINGS: { enableFilelistPreview: false, theme: 'system' } },
    })
    await page.goto(HOME_URL)

    // 其他增强不受影响，仅封面增强关闭
    await expect(page.locator('a.master-player')).toHaveCount(40)
    await expect(page.locator('li.with-ext-video-cover')).toHaveCount(0)
    await expect(page.locator('.ext-video-cover-root')).toHaveCount(0)
    await expect(page.locator('a.master-preview-switch-btn')).not.toHaveClass(/active/)
    expect(errors).toEqual([])
  })

  test('运行时切换预览开关：封面随设置卸载/重挂并持久化', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    const preview = page.locator('a.master-preview-switch-btn')
    const coverRoots = page.locator('li.with-ext-video-cover .ext-video-cover-root')
    await expect(coverRoots).toHaveCount(40)
    await expect(preview).toHaveClass(/active/)

    // 关闭预览：设置持久化、开关去 active、封面 Vue 应用卸载（挂载点清空）
    await preview.click()
    await expect(preview).not.toHaveClass(/active/)
    await expect.poll(async () => {
      const store = await gmStore(page)
      return (store.USER_SETTINGS as { enableFilelistPreview?: boolean } | undefined)?.enableFilelistPreview
    }).toBe(false)
    await expect.poll(async () =>
      coverRoots.first().evaluate(el => el.childElementCount),
    ).toBe(0)

    // 重新开启：设置持久化、开关 active、封面重新挂载出内容
    await preview.click()
    await expect(preview).toHaveClass(/active/)
    await expect.poll(async () => {
      const store = await gmStore(page)
      return (store.USER_SETTINGS as { enableFilelistPreview?: boolean } | undefined)?.enableFilelistPreview
    }).toBe(true)
    await expect.poll(async () =>
      page.locator('.ext-video-cover-root').last().evaluate(el => el.childElementCount),
    ).toBeGreaterThan(0)
    expect(errors).toEqual([])
  })
})
