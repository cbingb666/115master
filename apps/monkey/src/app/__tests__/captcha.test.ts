// @vitest-environment jsdom

import type { DialogCloseReason, DialogHandle } from '@115master/ui'
import type { App, VNodeChild } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}))

vi.mock('@/app/dialog', () => ({
  appDialog: { create: mocks.create },
}))

const apps: App[] = []

function deferred() {
  let settle!: (value: { reason: DialogCloseReason }) => void
  const closed = new Promise<{ reason: DialogCloseReason }>((resolve) => {
    settle = resolve
  })
  const handle: DialogHandle = {
    closed,
    close: vi.fn(() => settle({ reason: 'programmatic' })),
    destroy: vi.fn(() => settle({ reason: 'destroy' })),
  }

  return { handle, settle: (reason: DialogCloseReason) => settle({ reason }) }
}

function api() {
  return {
    getCaptchaSign: vi.fn().mockResolvedValue('captcha-sign'),
    getCaptchaImage: vi.fn((type: string, id?: number, nonce?: number) => (
      `https://captchaapi.115.com/image?type=${type}&id=${id ?? ''}&nonce=${nonce}`
    )),
    verifyCaptcha: vi.fn().mockResolvedValue({ state: true, message: '' }),
  }
}

function mount(content: () => VNodeChild) {
  const root = document.createElement('div')
  document.body.append(root)
  const app = createApp(defineComponent({
    setup: () => () => content(),
  }))
  app.mount(root)
  apps.push(app)
  return root
}

function button(root: ParentNode, name: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')]
    .find(item => item.textContent?.trim() === name)
}

function select(root: ParentNode, values: number[]) {
  values.forEach((value) => {
    root.querySelector<HTMLButtonElement>(`[data-captcha-candidate="${value}"]`)?.click()
  })
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  document.body.innerHTML = ''

  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '')
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open')
    }
  }
})

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('captcha dialog', () => {
  it('在 Master 弹窗中渲染原生点选验证并提交四个序号', async () => {
    document.body.innerHTML = '<div id="my-app"></div>'
    const service = deferred()
    const captcha = api()
    mocks.create.mockReturnValue(service.handle)
    const { showCaptcha } = await import('../captcha')

    const pending = showCaptcha(captcha)

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      title: '需要人机验证',
      showConfirm: false,
      showCancel: false,
      closeOnBackdrop: false,
      history: true,
    }))

    const options = mocks.create.mock.calls[0]?.[0]
    const root = mount(options.content)

    await vi.waitFor(() => expect(captcha.getCaptchaSign).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(root.querySelectorAll('[data-captcha-candidate]')).toHaveLength(10))
    expect(root.querySelector('iframe')).toBeNull()
    expect(root.querySelector('img[alt="验证码题目"]')).not.toBeNull()
    expect(root.textContent).not.toContain('请验证账号')

    select(root, [1, 9, 3, 5])
    await vi.waitFor(() => expect(button(root, '确认验证')?.disabled).toBe(false))
    button(root, '确认验证')?.click()

    await expect(pending).resolves.toBe(true)
    expect(captcha.verifyCaptcha).toHaveBeenCalledWith({
      code: '1935',
      sign: 'captcha-sign',
    })
    expect(service.handle.close).toHaveBeenCalledOnce()
  })

  it('验证失败后展示错误并自动换一组挑战', async () => {
    document.body.innerHTML = '<div id="my-app"></div>'
    const service = deferred()
    const captcha = api()
    captcha.getCaptchaSign
      .mockResolvedValueOnce('first-sign')
      .mockResolvedValueOnce('second-sign')
    captcha.verifyCaptcha.mockResolvedValueOnce({
      state: false,
      message: '验证码错误',
    })
    mocks.create.mockReturnValue(service.handle)
    const { showCaptcha } = await import('../captcha')

    const pending = showCaptcha(captcha)
    const options = mocks.create.mock.calls[0]?.[0]
    const root = mount(options.content)

    await vi.waitFor(() => expect(root.querySelectorAll('[data-captcha-candidate]')).toHaveLength(10))
    select(root, [0, 1, 2, 3])
    await vi.waitFor(() => expect(button(root, '确认验证')?.disabled).toBe(false))
    button(root, '确认验证')?.click()

    await vi.waitFor(() => expect(captcha.getCaptchaSign).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(root.textContent).toContain('验证码错误'))
    expect(captcha.verifyCaptcha).toHaveBeenCalledWith({ code: '0123', sign: 'first-sign' })
    expect(button(root, '确认验证')?.disabled).toBe(true)

    select(root, [4, 5, 6, 7])
    await vi.waitFor(() => expect(button(root, '确认验证')?.disabled).toBe(false))
    button(root, '确认验证')?.click()
    await expect(pending).resolves.toBe(true)
    expect(captcha.verifyCaptcha).toHaveBeenLastCalledWith({ code: '4567', sign: 'second-sign' })
  })

  it('同一时间只打开一次，取消后可以重新打开', async () => {
    document.body.innerHTML = '<div id="my-app"></div>'
    const firstService = deferred()
    const secondService = deferred()
    const captcha = api()
    mocks.create
      .mockReturnValueOnce(firstService.handle)
      .mockReturnValueOnce(secondService.handle)
    const { showCaptcha } = await import('../captcha')

    const first = showCaptcha(captcha)
    const duplicate = showCaptcha(captcha)
    const firstOptions = mocks.create.mock.calls[0]?.[0]
    const firstRoot = mount(firstOptions.content)

    expect(duplicate).toBe(first)
    expect(mocks.create).toHaveBeenCalledOnce()
    button(firstRoot, '稍后验证')?.click()
    await expect(first).resolves.toBe(false)

    const reopened = showCaptcha(captcha)

    expect(mocks.create).toHaveBeenCalledTimes(2)
    secondService.settle('escape')
    await expect(reopened).resolves.toBe(false)
  })

  it('在 115 官方首页挂载隔离的原生弹窗，不加载 iframe 或官方 show911 脚本', async () => {
    const captcha = api()
    const { showCaptcha } = await import('../captcha')

    const pending = showCaptcha(captcha)
    const host = document.querySelector<HTMLElement>('[data-app-captcha="host"]')
    const shadow = host?.shadowRoot

    expect(host).not.toBeNull()
    expect(shadow?.querySelector('iframe')).toBeNull()
    expect(document.querySelector('script[data-app-captcha="show911"]')).toBeNull()
    await vi.waitFor(() => expect(shadow?.querySelectorAll('[data-captcha-candidate]')).toHaveLength(10))
    expect(shadow?.querySelector('dialog')?.getAttribute('open')).not.toBeNull()
    expect(shadow?.textContent).not.toContain('请验证账号')

    select(shadow!, [2, 4, 6, 8])
    await vi.waitFor(() => expect(button(shadow!, '确认验证')?.disabled).toBe(false))
    button(shadow!, '确认验证')?.click()

    await expect(pending).resolves.toBe(true)
    expect(captcha.verifyCaptcha).toHaveBeenCalledWith({ code: '2468', sign: 'captcha-sign' })
    await vi.waitFor(() => {
      expect(document.querySelector('[data-app-captcha="host"]')).toBeNull()
    })
  })
})
