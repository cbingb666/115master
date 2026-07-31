import { expect, test } from '@playwright/test'
import { HOME_URL, setupHarness } from '../../support'
import { watch } from '../../support/homeUtils'

/**
 * TopHeaderMod：顶栏增强
 * - 删除官方云下载按钮，注入 Master 云下载按钮（点击走 Core.OFFL5Plug，免刷新重定向）
 * - 注入文件预览开关（绑定 userSettings.enableFilelistPreview）
 * - 修正上传/新建下拉菜单位置
 * - mode=search 时整体跳过
 */
test.describe('TopHeaderMod', () => {
  test('注入云下载按钮与预览开关，移除官方云下载按钮', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    /** Master 云下载按钮被 prepend 到顶栏最前 */
    const offline = page.locator('a.master-offline-task-btn')
    await expect(offline).toBeAttached()
    await expect(offline).toContainText('云下载')
    await expect(offline.locator('i.icon-operate.ifo-linktask')).toBeAttached()
    await expect(page.locator('#js_top_panel_box > div > a:first-child')).toHaveClass(/master-offline-task-btn/)

    // 官方云下载按钮被移除
    await expect(page.locator('.button[menu="offline_task"]')).toHaveCount(0)

    /** 预览开关：默认 enableFilelistPreview=true → active */
    const preview = page.locator('a.master-preview-switch-btn')
    await expect(preview).toBeAttached()
    await expect(preview).toHaveAttribute('title', '开启文件预览')
    await expect(preview).toHaveClass(/active/)
    await expect(preview.locator('iconify-icon.preview-off')).toBeAttached()
    await expect(preview.locator('iconify-icon.preview-on')).toBeAttached()

    /** 上传/新建下拉菜单 left 被修正到对应按钮位置 */
    const fixed = await page.evaluate(() => {
      const check = (name: string) => {
        const tab = document.querySelector(`[data-dropdown-tab="${name}"]`)
        const menu = document.querySelector<HTMLElement>(`[data-dropdown-content="${name}"]`)
        return menu?.style.left === `${tab?.getBoundingClientRect().left}px`
      }
      return check('upload_btn_add_dir') && check('create_new_add_dir')
    })
    expect(fixed).toBe(true)
    expect(errors).toEqual([])
  })

  test('点击云下载按钮：调用 Core.OFFL5Plug.OpenLink（免刷新重定向）', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    // 官方页面提供 window.Core；fixture 中由测试桩代替
    await page.evaluate(() => {
      (window as unknown as { Core: unknown }).Core = {
        OFFL5Plug: {
          OpenLink() {
            (window as unknown as { __offlineOpened: boolean }).__offlineOpened = true
          },
        },
      }
    })
    await page.locator('a.master-offline-task-btn').click()
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __offlineOpened?: boolean }).__offlineOpened),
    ).toBe(true)
    expect(errors).toEqual([])
  })

  test('搜索模式：跳过顶栏修改，保留官方按钮', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto('https://115.com/?mode=search&search_value=演示')

    await expect(page.locator('li[title="动漫"]')).toBeAttached()
    await expect(page.locator('a.master-offline-task-btn')).toHaveCount(0)
    await expect(page.locator('a.master-preview-switch-btn')).toHaveCount(0)
    await expect(page.locator('.button[menu="offline_task"]')).toBeAttached()
    expect(errors).toEqual([])
  })
})
