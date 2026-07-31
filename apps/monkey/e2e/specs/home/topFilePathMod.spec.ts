import type { MockApi } from '../../support'
import { expect, test } from '@playwright/test'
import { HOME_URL, setupHarness } from '../../support'
import { watch } from '../../support/homeUtils'
import { html } from '../../support/mockApi'
import { homeHtml } from '../../support/pages/homeHtml'

/**
 * TopFilePathMod：页面标题改写为当前路径 + 返回上级目录按钮
 * 依赖官方 DOM：.list-topheader .top-file-path .file-path 下的 a[titletext][cid]
 */

/** 用多级路径的 HOME fixture 覆盖默认文档 */
function withPaths(paths: { title: string, cid: string }[]) {
  return (api: MockApi) =>
    api.override(/^https:\/\/115\.com\/\?/, ({ route, request }) => {
      if (!request.isNavigationRequest())
        return
      return html(route, homeHtml({ paths }))
    })
}

test.describe('TopFilePathMod', () => {
  test('根目录：标题改写为当前路径，不显示返回按钮', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    await expect(page).toHaveTitle('根目录')
    await expect(page.locator('.master-back-button')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('子目录：标题改写并显示返回按钮，点击返回触发上级路径链接', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page, {
      mocks: withPaths([
        { title: '根目录', cid: '0' },
        { title: '动漫', cid: '1001' },
      ]),
    })
    await page.goto(HOME_URL)

    // 多级路径下根目录被省略，标题为当前目录名
    await expect(page).toHaveTitle('动漫')
    const back = page.locator('.master-back-button')
    await expect(back).toBeAttached()
    await expect(back).toContainText('返回目录')

    // 点击返回按钮 = 点击倒数第二个路径链接（此处为根目录链接）
    await page.evaluate(() => {
      document.querySelector('.file-path a')?.addEventListener('click', () => {
        (window as unknown as { __backClicked: boolean }).__backClicked = true
      })
    })
    await back.click()
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __backClicked?: boolean }).__backClicked),
    ).toBe(true)
    expect(errors).toEqual([])
  })

  test('监听路径变化：路径增删时更新标题与返回按钮', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page, {
      mocks: withPaths([
        { title: '根目录', cid: '0' },
        { title: '动漫', cid: '1001' },
      ]),
    })
    await page.goto(HOME_URL)
    await expect(page.locator('.master-back-button')).toBeAttached()

    // 模拟官方返回根目录：路径收缩为一级 → 标题更新、返回按钮移除
    await page.evaluate(() => {
      document.querySelector('.file-path a:last-child')?.remove()
    })
    await expect(page).toHaveTitle('根目录')
    await expect(page.locator('.master-back-button')).toHaveCount(0)

    // 模拟官方进入其他子目录：路径新增一级 → 标题更新、返回按钮重新出现
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = 'javascript:;'
      link.setAttribute('titletext', '电影')
      link.setAttribute('cid', '1002')
      link.textContent = '电影'
      document.querySelector('.file-path')?.append(link)
    })
    await expect(page).toHaveTitle('电影')
    await expect(page.locator('.master-back-button')).toBeAttached()
    expect(errors).toEqual([])
  })
})
