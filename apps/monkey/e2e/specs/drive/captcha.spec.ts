import type { Page } from '@playwright/test'
import type { MockApi } from '../../support'
import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'
import {
  CORS,
  FILES_RE,
  HOME_URL,
  json,
  MASTER_URL,
  setupHarness,
  watch,
} from '../../support'

const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

interface CaptchaMock {
  posts: string[]
}

function mockCaptcha(api: MockApi): CaptchaMock {
  const posts: string[] = []

  api.override(/^https:\/\/captchaapi\.115\.com\/\?.*t=sign/, ({ route }) => json(route, {
    state: true,
    sign: 'captcha-sign',
  }))
  api.override(/^https:\/\/captchaapi\.115\.com\/\?.*ct=index/, async ({ route }) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: CORS,
      body: pixel,
    })
    return true
  })
  api.override(/^https:\/\/webapi\.115\.com\/user\/captcha/, ({ route, request }) => {
    posts.push(request.postData() ?? '')
    return json(route, { state: true })
  })

  return { posts }
}

async function solve(page: Page) {
  const dialog = page.getByRole('dialog', { name: '需要人机验证' })
  await expect(dialog).toBeVisible()
  await expect(dialog).not.toContainText('请验证账号')
  await expect(dialog.locator('iframe')).toHaveCount(0)
  await expect(dialog.getByAltText('验证码题目')).toBeVisible()
  await expect(dialog.getByRole('button', { name: /^选择候选文字 / })).toHaveCount(10)

  await dialog.getByRole('button', { name: '选择候选文字 2', exact: true }).click()
  await dialog.getByRole('button', { name: '选择候选文字 10', exact: true }).click()
  await dialog.getByRole('button', { name: '选择候选文字 4', exact: true }).click()
  await dialog.getByRole('button', { name: '选择候选文字 6', exact: true }).click()
  await dialog.getByRole('button', { name: '确认验证' }).click()
  await expect(dialog).toHaveCount(0)
}

test('Master 的 911 响应打开原生点选验证并提交结果', async ({ page }) => {
  const errors = watch(page)
  let captcha!: CaptchaMock

  await setupHarness(page, {
    mocks: (api) => {
      api.override(FILES_RE, ({ route }) => json(route, {
        state: false,
        code: 911,
        error: '请验证账号',
        data: { url: 'https://captchaapi.115.com/custom?token=e2e' },
      }))
      captcha = mockCaptcha(api)
    },
  })
  await page.goto(MASTER_URL)

  await solve(page)

  await expect.poll(() => captcha.posts.length).toBe(1)
  const data = new URLSearchParams(captcha.posts[0])
  expect(Object.fromEntries(data)).toMatchObject({
    code: '1935',
    sign: 'captcha-sign',
    ac: 'security_code',
    type: 'web',
    ctype: 'web',
    client: 'web',
  })
  await expect(page.locator('script[data-app-captcha="show911"]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('115 官方首页也使用自有原生验证弹窗', async ({ page }) => {
  const errors = watch(page)
  const browserAlerts: string[] = []
  let captcha!: CaptchaMock

  page.on('dialog', async (dialog) => {
    browserAlerts.push(dialog.message())
    await dialog.dismiss()
  })
  await setupHarness(page, {
    mocks: (api) => {
      api.override(/^https:\/\/webapi\.115\.com\/files\/download/, ({ route }) => json(route, {
        state: false,
        errcode: 911,
        error: '请验证账号',
      }))
      captcha = mockCaptcha(api)
    },
  })
  await page.goto(HOME_URL)

  await page.locator('li[iv="1"] a[menu="download_one"]').first().dispatchEvent('click')
  await solve(page)

  await expect.poll(() => captcha.posts.length).toBe(1)
  expect(browserAlerts).toEqual([])
  expect(errors).toEqual([])
})
