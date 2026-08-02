import { Buffer } from 'node:buffer'
import { generateKeyPairSync } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { CORS, FILES_RE, json, MASTER_URL, setupHarness, watch } from '../../support'

const key = Buffer.from(
  generateKeyPairSync('rsa', { modulusLength: 1024 })
    .publicKey
    .export({ type: 'spki', format: 'pem' })
    .toString(),
).toString('base64')

const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

test('会话失效后跳转登录页并完成账号登录验证码分流', async ({ page }) => {
  const errors = watch(page)
  const posts: string[] = []

  await setupHarness(page, {
    mocks: (api) => {
      api.override(FILES_RE, ({ route }) => json(route, {
        state: false,
        errNo: 990001,
        error: '登录状态已失效',
      }))
      api.override(/^https:\/\/qrcodeapi\.115\.com\/api\/1\.0\/web\/1\.0\/token/, ({ route }) => json(route, {
        state: true,
        data: { uid: 'qr-uid', time: 1, sign: 'qr-sign', qrcode: 'qr-value' },
      }))
      api.override(/^https:\/\/qrcodeapi\.115\.com\/get\/status/, ({ route }) => json(route, {
        state: true,
        data: { status: 0 },
      }))
      api.override(/^https:\/\/qrcodeapi\.115\.com\/api\/1\.0\/web\/1\.0\/qrcode/, async ({ route }) => {
        await route.fulfill({ status: 200, contentType: 'image/png', headers: CORS, body: pixel })
        return true
      })
      api.override(/^https:\/\/passportapi\.115\.com\/app\/1\.0\/web\/5\.0\.1\/login\/getKey/, ({ route }) => json(route, {
        state: true,
        data: { key },
      }))
      api.override(/^https:\/\/passportapi\.115\.com\/app\/1\.0\/web\/1\.0\/login\/login/, ({ route, request }) => {
        posts.push(request.postData() ?? '')
        if (posts.length === 1) {
          return json(route, {
            state: false,
            err_code: 10098,
            err_name: 'code',
            err_msg: '请输入验证码',
          })
        }
        return json(route, {
          state: false,
          err_code: 1,
          err_name: 'account',
          err_msg: '验证请求已记录',
        })
      })
      api.override(/^https:\/\/captchaapi\.115\.com\/\?.*t=sign/, ({ route }) => json(route, {
        state: true,
        sign: 'captcha-sign',
      }))
      api.override(/^https:\/\/captchaapi\.115\.com\/\?.*ct=index/, async ({ route }) => {
        await route.fulfill({ status: 200, contentType: 'image/png', headers: CORS, body: pixel })
        return true
      })
    },
  })
  await page.goto(MASTER_URL)

  await expect(page).toHaveURL(/#\/login/)
  const login = page.locator('[data-login-page]')
  await expect(login.getByRole('heading', { name: '登录 115' })).toBeVisible()
  await login.getByRole('button', { name: '账号登录' }).click()
  await login.locator('[name="username"]').fill('115')
  await login.locator('[name="password"]').fill('secret')
  await login.getByRole('button', { name: '登录', exact: true }).click()

  await expect(login.getByRole('heading', { name: '安全验证码' })).toBeVisible()
  await page.getByTitle('选择候选文字 2', { exact: true }).click()
  await page.getByTitle('选择候选文字 1', { exact: true }).click()
  await page.getByRole('button', { name: '确认验证' }).click()
  await expect.poll(() => posts.length).toBe(2)

  const data = new URLSearchParams(posts[1])
  expect(data.get('login[code]')).toBe('10')
  expect(data.get('login[sid]')).toBe('captcha-sign')
  expect(data.get('code_id')).toBe('captcha-sign')
  expect(errors).toEqual([])
})

test('设置中显示当前账号，确认后退出网页端登录', async ({ page }) => {
  const errors = watch(page)
  let logoutCalls = 0

  await setupHarness(page, {
    mocks: (api) => {
      api.override(/^https:\/\/passportapi\.115\.com\/app\/1\.0\/web\/1\.0\/logout\/logout/, async ({ route }) => {
        logoutCalls += 1
        await route.fulfill({ status: 200, contentType: 'text/plain', headers: CORS, body: '' })
        return true
      })
    },
  })
  await page.goto(MASTER_URL)

  await page.locator('button[title="偏好设置"]:visible').click()
  const preferences = page.getByRole('dialog', { name: '偏好设置' })
  const overflow = await preferences.locator('.ui-navigation-stack__content').evaluate(async (content) => {
    const account = Array.from(content.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === '账号')

    if (!(account instanceof HTMLButtonElement))
      throw new Error('偏好设置缺少账号 Tab')

    return await new Promise<number>((resolve) => {
      const samples: number[] = []
      const started = performance.now()

      function sample() {
        samples.push(content.scrollHeight - content.clientHeight)

        if (performance.now() - started >= 300) {
          resolve(Math.max(...samples))
          return
        }
        requestAnimationFrame(sample)
      }

      account.click()
      sample()
    })
  })
  expect(overflow).toBe(0)
  await expect(preferences.getByText('e2e_user', { exact: true })).toBeVisible()
  await expect(preferences.getByText('100000001', { exact: true })).toBeVisible()
  await expect(preferences.getByText('永久会员', { exact: true })).toBeVisible()
  const uidLabel = await preferences.getByText('UID', { exact: true }).boundingBox()
  const expireLabel = await preferences.getByText('会员到期', { exact: true }).boundingBox()
  expect(Math.abs((uidLabel?.y ?? 0) - (expireLabel?.y ?? 0))).toBeLessThanOrEqual(2)
  const content = preferences.locator('[data-account-preferences]').locator('..').locator('..')
  const heights = await content.locator(':scope > nav').evaluate((menu) => {
    if (!menu.parentElement)
      throw new Error('偏好设置导航缺少内容容器')

    return {
      menu: menu.getBoundingClientRect().height,
      container: menu.parentElement.getBoundingClientRect().height,
    }
  })
  expect(Math.abs(heights.menu - heights.container)).toBeLessThanOrEqual(1)

  await preferences.getByRole('button', { name: '退出登录' }).click()
  let confirm = page.getByRole('dialog', { name: '退出登录' })
  await expect(confirm).toContainText('确定要退出账号吗？')
  expect(logoutCalls).toBe(0)
  await confirm.getByRole('button', { name: '取消' }).click()
  expect(logoutCalls).toBe(0)

  await preferences.getByRole('button', { name: '退出登录' }).click()
  confirm = page.getByRole('dialog', { name: '退出登录' })
  await confirm.getByRole('button', { name: '确定' }).click()

  await expect.poll(() => logoutCalls).toBe(1)
  await expect(page).toHaveURL(/#\/login/)
  await expect(page.getByRole('heading', { name: '登录 115' })).toBeVisible()
  expect(errors).toEqual([])
})
