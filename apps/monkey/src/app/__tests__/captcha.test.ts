// @vitest-environment jsdom

import type { DialogCloseReason, DialogHandle } from '@115master/ui'
import type { App, VNodeChild } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}))

vi.hoisted(() => {
  class MediaErrorStub {
    static readonly MEDIA_ERR_ABORTED = 1
    static readonly MEDIA_ERR_NETWORK = 2
    static readonly MEDIA_ERR_DECODE = 3
    static readonly MEDIA_ERR_SRC_NOT_SUPPORTED = 4
  }

  Object.defineProperty(globalThis, 'MediaError', {
    configurable: true,
    value: MediaErrorStub,
  })
})

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
      title: '人机验证',
      showConfirm: false,
      showCancel: false,
      size: 'md',
      closeOnBackdrop: false,
      history: true,
    }))

    const options = mocks.create.mock.calls[0]?.[0]
    const root = mount(options.content)

    expect(root.querySelector('[data-captcha-loading-layout]')).not.toBeNull()
    expect(root.querySelector('[data-captcha-loading-prompt]')?.classList).toContain('aspect-[72/23]')
    expect(root.querySelector('[data-captcha-loading-selection]')?.classList).toContain('h-20')
    expect(root.querySelector('[data-captcha-loading-candidates]')?.children).toHaveLength(10)
    await vi.waitFor(() => expect(captcha.getCaptchaSign).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(root.querySelectorAll('[data-captcha-candidate]')).toHaveLength(10))
    expect(root.querySelectorAll('[data-captcha-motion-source]')).toHaveLength(10)
    expect(root.querySelector('iframe')).toBeNull()
    expect(root.querySelector('img[alt="验证码题目"]')).not.toBeNull()
    expect(root.querySelector('[data-captcha-prompt]')?.classList).toContain('aspect-[72/23]')
    expect(root.textContent).not.toContain('请验证账号')
    expect(root.textContent).not.toContain('看不清，换一组')
    expect(root.textContent).not.toContain('请观察图片提示，并按顺序点击下方对应文字。')
    expect(root.textContent).toContain('请观察图片提示，并按顺序点击上方对应文字。')
    expect([...root.querySelectorAll('p')].some(item => (
      item.textContent?.includes('请观察图片提示，并按顺序点击上方对应文字。')
    ))).toBe(false)
    const selection = root.querySelector('[data-captcha-selection]')
    const challenge = root.querySelector('[data-app-captcha-challenge]')
    const placeholder = () => root.querySelector('[data-captcha-placeholder]')
    const candidatesGroup = root.querySelector('[aria-label="验证码候选文字"]')
    const removeAll = () => root.querySelector<HTMLButtonElement>('[data-captcha-remove-all]')
    expect(selection).not.toBeNull()
    expect(challenge?.classList.contains('select-none')).toBe(true)
    expect(placeholder()?.textContent).toContain('请观察图片提示，并按顺序点击上方对应文字。')
    expect(placeholder()?.textContent).toContain('点击上方图片，换一张')
    expect(selection?.classList.contains('order-1')).toBe(true)
    expect(selection?.classList.contains('h-20')).toBe(true)
    expect(selection?.classList.contains('min-h-14')).toBe(false)
    expect(candidatesGroup?.classList.contains('order-2')).toBe(true)
    expect(removeAll()).toBeNull()
    const firstCandidate = root.querySelector<HTMLButtonElement>('[data-captcha-candidate="0"]')
    expect(firstCandidate?.classList.contains('bg-transparent')).toBe(true)
    expect(firstCandidate?.classList.contains('p-0')).toBe(true)
    expect(firstCandidate?.classList.contains('p-1')).toBe(false)

    root.querySelector<HTMLButtonElement>('[aria-label="换一组验证码"]')?.click()
    await vi.waitFor(() => expect(captcha.getCaptchaSign).toHaveBeenCalledTimes(2))
    await nextTick()

    select(root, [1])
    await vi.waitFor(() => expect(root.querySelector('[data-captcha-motion-target="1"]')).not.toBeNull())
    expect(root.querySelector('[data-captcha-selection]')?.textContent?.trim()).toBe('')
    expect(placeholder()).toBeNull()
    expect(removeAll()?.disabled).toBe(false)
    expect(removeAll()?.classList.contains('btn-ghost')).toBe(true)
    expect(removeAll()?.classList.contains('btn-md')).toBe(true)
    const chosen = root.querySelector<HTMLButtonElement>('[data-captcha-candidate="1"]')
    expect(chosen?.classList.contains('bg-primary/30')).toBe(true)
    expect(chosen?.classList.contains('border-primary/60')).toBe(false)
    expect(chosen?.classList.contains('ring-2')).toBe(false)
    expect(chosen?.disabled).toBe(false)
    expect(chosen?.ariaLabel).toBe('撤回候选文字 2')
    const chosenImage = chosen?.querySelector('[data-captcha-chosen-image="1"]')
    const chosenMask = chosen?.querySelector('[data-captcha-chosen-mask]')
    expect(chosenImage).not.toBeNull()
    expect(chosenImage?.classList.contains('grayscale')).toBe(false)
    expect(chosenMask?.classList.contains('bg-primary/15')).toBe(true)
    const source = root.querySelector('[data-captcha-motion-source="1"]')
    const target = root.querySelector('[data-captcha-motion-target="1"]')
    expect(target).not.toBeNull()
    expect(target?.getAttribute('data-captcha-layout-id')).toBe(
      source?.getAttribute('data-captcha-layout-id'),
    )
    const anchor = root.querySelector('[data-captcha-selected="0"]')
    const selected = root.querySelector<HTMLButtonElement>('[aria-label="删除已选择文字 1"]')
    expect(root.querySelector('[data-captcha-selection]')?.classList.contains('h-20')).toBe(true)
    expect(anchor?.classList.contains('size-12')).toBe(true)
    expect(anchor?.classList.contains('sm:size-14')).toBe(true)
    expect(anchor?.classList.contains('border-transparent')).toBe(true)
    expect(selected?.classList.contains('btn')).toBe(true)
    expect(selected?.classList.contains('btn-neutral')).toBe(true)
    expect(selected?.classList.contains('btn-sm')).toBe(true)
    expect(selected?.classList.contains('btn-ghost')).toBe(false)
    chosen?.click()
    await vi.waitFor(() => expect(root.querySelector('[data-captcha-motion-target]')).toBeNull())
    expect(root.querySelector('[data-captcha-selection]')).not.toBeNull()
    expect(placeholder()?.textContent).toContain('请观察图片提示，并按顺序点击上方对应文字。')
    expect(placeholder()?.textContent).toContain('点击上方图片，换一张')
    expect(removeAll()).toBeNull()

    select(root, [1, 9])
    await nextTick()
    expect(removeAll()?.disabled).toBe(false)
    root.querySelector<HTMLElement>('[data-captcha-selected="0"]')?.click()
    await nextTick()
    expect(root.querySelector('[data-captcha-motion-target="1"]')).toBeNull()
    expect(root.querySelector('[data-captcha-motion-target="9"]')).not.toBeNull()
    removeAll()?.click()
    await nextTick()
    expect(root.querySelector('[data-captcha-motion-target]')).toBeNull()

    select(root, [1, 9, 3, 5])
    await nextTick()
    const candidates = [...root.querySelectorAll<HTMLButtonElement>('[data-captcha-candidate]')]
    expect(candidates.filter(candidate => candidate.disabled)).toHaveLength(6)
    expect([1, 9, 3, 5].every(index => candidates[index]?.disabled === false)).toBe(true)
    expect(candidates.filter(candidate => candidate.disabled).every(candidate => (
      candidate.classList.contains('opacity-40')
    ))).toBe(true)
    expect([1, 9, 3, 5].every(index => !candidates[index]?.classList.contains('opacity-40'))).toBe(true)
    await vi.waitFor(() => expect(button(root, '确认')?.disabled).toBe(false))
    button(root, '确认')?.click()

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
    await vi.waitFor(() => expect(button(root, '确认')?.disabled).toBe(false))
    button(root, '确认')?.click()

    await vi.waitFor(() => expect(captcha.getCaptchaSign).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(root.textContent).toContain('验证码错误'))
    expect(captcha.verifyCaptcha).toHaveBeenCalledWith({ code: '0123', sign: 'first-sign' })
    expect(button(root, '确认')?.disabled).toBe(true)

    select(root, [4, 5, 6, 7])
    await vi.waitFor(() => expect(button(root, '确认')?.disabled).toBe(false))
    button(root, '确认')?.click()
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
    button(firstRoot, '稍后')?.click()
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
    await vi.waitFor(() => expect(button(shadow!, '确认')?.disabled).toBe(false))
    button(shadow!, '确认')?.click()

    await expect(pending).resolves.toBe(true)
    expect(captcha.verifyCaptcha).toHaveBeenCalledWith({ code: '2468', sign: 'captcha-sign' })
    await vi.waitFor(() => {
      expect(document.querySelector('[data-app-captcha="host"]')).toBeNull()
    })
  })
})
