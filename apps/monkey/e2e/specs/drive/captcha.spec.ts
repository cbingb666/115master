import type { Locator, Page } from '@playwright/test'
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

interface CaptchaMotionFrame {
  anchorBorderColor: string
  borderRadius: string
  removeOpacity: string
  transform: string
  translateY: number
}

interface CaptchaMotionWindow extends Window {
  __captchaMotionFrames?: CaptchaMotionFrame[]
}

async function expectMoving(...anchors: Locator[]) {
  await expect.poll(async () => Promise.all(anchors.map(async anchor => ({
    flying: await anchor.getAttribute('data-captcha-flying'),
    hidden: await anchor.evaluate(element => element.classList.contains('border-transparent')),
  }))), {
    intervals: [10, 20, 50],
    timeout: 1000,
  }).toEqual(anchors.map(() => ({ flying: 'true', hidden: true })))
}

function mockCaptcha(api: MockApi): CaptchaMock {
  const posts: string[] = []

  api.override(/^https:\/\/captchaapi\.115\.com\/\?.*t=sign/, async ({ route }) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return json(route, {
      state: true,
      sign: 'captcha-sign',
    })
  })
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
  const dialog = page.getByRole('dialog', { name: '人机验证' })
  await expect(dialog).toBeVisible()
  await expect(dialog).not.toContainText('请验证账号')
  await expect(dialog.locator('iframe')).toHaveCount(0)
  const loading = dialog.locator('[data-captcha-loading-layout]')
  await expect(loading).toBeVisible()
  await expect(loading.locator('[data-captcha-loading-candidates] > *')).toHaveCount(10)
  const loadingBox = await dialog.boundingBox()
  expect(loadingBox).not.toBeNull()
  await expect(dialog.getByAltText('验证码题目')).toBeVisible()
  await expect(loading).toHaveCount(0)
  const loadedBox = await dialog.boundingBox()
  expect(loadedBox).not.toBeNull()
  expect(loadedBox!.height).toBeCloseTo(loadingBox!.height, 0)
  const prompt = dialog.getByRole('button', { name: '换一组验证码' })
  const promptBox = await prompt.boundingBox()
  expect(promptBox).not.toBeNull()
  expect(promptBox!.width / promptBox!.height).toBeCloseTo(72 / 23, 2)
  await prompt.hover()
  await expect(page.getByRole('tooltip').filter({ hasText: '换一组' })).toBeVisible()
  const candidatesGroup = dialog.getByRole('group', { name: '验证码候选文字' })
  const selection = dialog.getByRole('group', { name: '已选文字' })
  const removeAll = dialog.getByRole('button', { name: '删除全部已选文字' })
  const firstCandidate = dialog.getByRole('button', { name: '选择候选文字 1', exact: true })
  const movingCandidate = dialog.locator('[data-captcha-candidate="1"]')
  const reorderCandidate = dialog.locator('[data-captcha-candidate="9"]')
  const placeholder = selection.getByText('请观察图片提示，并按顺序点击上方对应文字。', { exact: true })
  const hint = selection.getByText('点击上方图片，换一张', { exact: true })
  await expect(dialog.getByRole('button', { name: /^选择候选文字 / })).toHaveCount(10)
  await expect(dialog.getByRole('button', { name: '看不清，换一组', exact: true })).toHaveCount(0)
  await expect(dialog.getByText('请观察图片提示，并按顺序点击下方对应文字。', { exact: true })).toHaveCount(0)
  await expect(dialog.getByText('请观察图片提示，并按顺序点击上方对应文字。', { exact: true })).toHaveCount(1)
  await expect(selection).toBeVisible()
  await expect(placeholder).toBeVisible()
  await expect(hint).toBeVisible()
  await expect(dialog.locator('[data-app-captcha-challenge]')).toHaveCSS('user-select', 'none')
  await expect(removeAll).toHaveCount(0)
  await expect(firstCandidate).toHaveCSS('padding', '0px')
  await expect(firstCandidate).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  const selectionBox = await selection.boundingBox()
  const candidatesBox = await candidatesGroup.boundingBox()
  expect(selectionBox).not.toBeNull()
  expect(candidatesBox).not.toBeNull()
  expect(selectionBox!.height).toBe(80)
  expect(selectionBox!.y + selectionBox!.height).toBeLessThanOrEqual(candidatesBox!.y)

  await page.evaluate(() => {
    const frames: CaptchaMotionFrame[] = []
    const motionWindow = window as CaptchaMotionWindow
    motionWindow.__captchaMotionFrames = frames
    const root = document.querySelector('[data-app-captcha-challenge]')
      ?? document.querySelector<HTMLElement>('[data-app-captcha="host"]')
        ?.shadowRoot
        ?.querySelector('[data-app-captcha-challenge]')
    if (!root)
      return

    const observer = new MutationObserver(() => {
      const target = root.querySelector<HTMLElement>('[data-captcha-motion-target="1"]')
      if (!target)
        return
      observer.disconnect()

      const startedAt = performance.now()
      const sample = () => {
        if (!target.isConnected || performance.now() - startedAt > 1000)
          return
        const style = getComputedStyle(target)
        const transform = style.transform
        const anchor = target.closest('[data-captcha-selected]')
        const remove = anchor?.querySelector('[data-captcha-selected-remove]')
        frames.push({
          anchorBorderColor: anchor ? getComputedStyle(anchor).borderTopColor : 'missing',
          borderRadius: style.borderRadius,
          removeOpacity: remove ? getComputedStyle(remove).opacity : 'missing',
          transform,
          translateY: transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42,
        })
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    observer.observe(root, { childList: true, subtree: true })
  })

  await movingCandidate.click()
  await expect(selection).toHaveText('')
  await expect(placeholder).toHaveCount(0)
  await expect(hint).toHaveCount(0)
  await expect(removeAll).toBeEnabled()
  await expect(removeAll).toHaveClass(/btn-ghost/)
  await expect(removeAll).toHaveClass(/btn-md/)
  await expect(movingCandidate).toHaveClass(/bg-primary\/30/)
  await expect(movingCandidate).toHaveAttribute('aria-label', '撤回候选文字 2')
  await expect(movingCandidate).toBeEnabled()
  const chosenImage = movingCandidate.locator('[data-captcha-chosen-image="1"]')
  const chosenMask = movingCandidate.locator('[data-captcha-chosen-mask]')
  await expect(chosenImage).toBeVisible()
  await expect(chosenImage).toHaveCSS('filter', 'none')
  await expect(chosenMask).toHaveClass(/bg-primary\/15/)
  await expect(chosenMask).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(movingCandidate).not.toHaveClass(/border-primary/)
  expect(await movingCandidate.evaluate(element => (
    element.classList.contains('ring-2')
    || element.classList.contains('ring-primary/15')
  ))).toBe(false)
  const firstAnchor = dialog.locator('[data-captcha-selected="0"]')
  const firstSelected = dialog.getByRole('button', { name: '删除已选择文字 1' })
  const sourceCandidate = movingCandidate.locator('[data-captcha-motion-source="1"]')
  await expect(firstAnchor).toHaveCSS('width', '56px')
  await expect(firstSelected).toHaveClass(/btn-neutral/)
  await expect(firstSelected).toHaveClass(/btn-sm/)
  await expect(firstSelected).not.toHaveClass(/btn-ghost/)
  expect((await selection.boundingBox())?.height).toBe(selectionBox!.height)
  await expect.poll(() => page.evaluate(() => {
    const frames = (window as CaptchaMotionWindow).__captchaMotionFrames ?? []
    const moving = frames.filter(frame => (
      frame.transform !== 'none'
      && frame.transform !== 'matrix(1, 0, 0, 1, 0, 0)'
    ))
    return {
      moved: moving.length > 0,
      movedUp: moving.some(frame => frame.translateY > 1),
      anchorHidden: moving.length > 0 && moving.every(frame => frame.anchorBorderColor === 'rgba(0, 0, 0, 0)'),
      removeHidden: moving.length > 0 && moving.every(frame => frame.removeOpacity === '0'),
      stayedRounded: moving.length > 0 && moving.every(frame => Number.parseFloat(frame.borderRadius) > 0),
    }
  })).toEqual({ anchorHidden: true, moved: true, movedUp: true, removeHidden: true, stayedRounded: true })
  await expect(firstAnchor).not.toHaveAttribute('data-captcha-flying', 'true')
  await expect(sourceCandidate).toHaveCSS('visibility', 'hidden')
  await firstAnchor.hover()
  await expect(firstSelected).toHaveCSS('opacity', '1')
  await reorderCandidate.click()
  const secondAnchor = dialog.locator('[data-captcha-selected="1"]')
  await expectMoving(firstAnchor, secondAnchor)
  await expect(sourceCandidate).toHaveCSS('visibility', 'hidden')
  await expect(firstAnchor).not.toHaveAttribute('data-captcha-flying', 'true')
  await expect(secondAnchor).not.toHaveAttribute('data-captcha-flying', 'true')
  await reorderCandidate.click()
  await expectMoving(firstAnchor)
  await expect(firstAnchor).not.toHaveAttribute('data-captcha-flying', 'true')
  await reorderCandidate.click()
  await expect(dialog.locator('[data-captcha-selected]')).toHaveCount(2)
  await expect(firstAnchor).not.toHaveAttribute('data-captcha-flying', 'true')
  await expect(secondAnchor).not.toHaveAttribute('data-captcha-flying', 'true')
  await firstAnchor.click({ position: { x: 4, y: 4 } })
  await expect(dialog.locator('[data-captcha-motion-target="1"]')).toHaveCount(0)
  await expect(dialog.locator('[data-captcha-selected]')).toHaveCount(1)
  await expect(movingCandidate).toHaveAttribute('aria-label', '选择候选文字 2')
  await removeAll.click()
  await expect(dialog.locator('[data-captcha-motion-target="9"]')).toHaveCount(0)
  await expect(placeholder).toBeVisible()
  await expect(hint).toBeVisible()
  await expect(removeAll).toHaveCount(0)
  await dialog.getByRole('button', { name: '选择候选文字 2', exact: true }).click()
  await dialog.getByRole('button', { name: '选择候选文字 10', exact: true }).click()
  await dialog.getByRole('button', { name: '选择候选文字 4', exact: true }).click()
  await dialog.getByRole('button', { name: '选择候选文字 6', exact: true }).click()
  const undoCandidate = dialog.locator('[data-captcha-candidate="5"]')
  await expect(dialog.locator('[data-captcha-candidate]:disabled')).toHaveCount(6)
  await expect(undoCandidate).toHaveAttribute('aria-label', '撤回候选文字 6')
  await undoCandidate.click()
  await expect(dialog.locator('[data-captcha-candidate]:disabled')).toHaveCount(0)
  await expect(undoCandidate).toHaveAttribute('aria-label', '选择候选文字 6')
  await undoCandidate.click()
  await expect(dialog.locator('[data-captcha-candidate]:disabled')).toHaveCount(6)
  await dialog.getByRole('button', { name: '确认', exact: true }).click()
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
