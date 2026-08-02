import { expect, test } from '@playwright/test'
import { dirs, HOME_URL, json, MASTER_URL, setupHarness, watch } from '../support'

const OFFLINE_QUOTA_RE = /^https:\/\/115\.com\/web\/lixian\?/

test.describe('smoke', () => {
  test('MASTER：SPA 挂载 #my-app 并渲染 mock 文件列表', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page, {
      mocks: api => api.override(OFFLINE_QUOTA_RE, ({ route }) => json(route, {
        state: true,
        count: 10,
        surplus: 8,
        used: 2,
        package: [],
        max_size: 0,
      })),
    })
    await page.goto(MASTER_URL)

    await expect(page.locator('#my-app')).toBeAttached()
    await expect(page.locator('html')).toHaveClass(/\bui-scrollbar\b/)
    await expect(page.locator('html')).toHaveClass(/\bui-scrollbar-md\b/)
    expect(await page.locator('html').evaluate(element => getComputedStyle(element, '::-webkit-scrollbar').width)).toBe('8px')
    await expect(page.locator('[data-ui-watermark]')).toHaveCount(0)
    const first = dirs['0'].items.find(i => i.fc === 1)!
    await expect(page.getByText(first.n).first()).toBeVisible()

    await page.getByRole('button', { name: '离线下载' }).click()
    const offline = page.getByRole('dialog', { name: '离线下载' })
    await expect(offline).toBeVisible()
    await expect(offline.locator('textarea')).toHaveClass(/\bui-scrollbar-md\b/)
    await offline.getByRole('button', { name: '取消' }).click()
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
