import { expect, test } from '@playwright/test'
import { HOME_URL, setupHarness } from '../../support'
import { watch } from '../../support/homeUtils'

/**
 * NavMod：向官方 .panel-nav 注入 Master Drive 入口
 */
test.describe('NavMod', () => {
  test('注入 115Master 入口链接', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    const link = page.locator('.panel-nav a.master-drive-link')
    await expect(link).toHaveCount(1)
    await expect(link).toHaveAttribute('href', 'https://115.com/web/lixian/master/#/drive')
    await expect(link).toHaveAttribute('target', '_self')
    await expect(link).toHaveText('115Master')
    expect(errors).toEqual([])
  })
})
