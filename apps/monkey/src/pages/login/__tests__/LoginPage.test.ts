// @vitest-environment jsdom

import { beforeEach, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  auth: {
    login: vi.fn(),
    getQrcodeToken: vi.fn(),
    getQrcodeStatus: vi.fn(),
    loginQrcode: vi.fn(),
    getQrcodeImage: vi.fn(() => 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='),
    getCaptchaSign: vi.fn(),
    getCaptchaImage: vi.fn(() => 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='),
    sendSms: vi.fn(),
    isSmsCaptchaRequired: vi.fn(),
    verify: vi.fn(),
    cancelClose: vi.fn(),
  },
}))

vi.mock('@/utils/drive115Instance', () => ({ drive115: { auth: mocks.auth } }))
vi.mock('@/app/login', () => ({
  DEFAULT_LOGIN_REASON: '登录 115 后即可继续使用 MasterApp。',
  resolveLoginRedirect: () => '/',
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { reason: '请重新登录' } }),
  useRouter: () => ({ replace: vi.fn().mockResolvedValue(undefined) }),
}))

vi.mock('@115master/ui', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    Button: defineComponent({
      inheritAttrs: false,
      props: {
        type: { type: String, default: 'button' },
        loading: Boolean,
        disabled: Boolean,
      },
      emits: ['click'],
      setup(props, { attrs, emit, slots }) {
        return () => h('button', {
          ...attrs,
          type: props.type,
          disabled: props.loading || props.disabled,
          onClick: (event: MouseEvent) => emit('click', event),
        }, slots.default?.())
      },
    }),
  }
})

const { default: LoginPage } = await import('../LoginPage')

function button(root: HTMLElement, label: string) {
  return [...root.querySelectorAll('button')]
    .find(item => item.textContent?.trim() === label) as HTMLButtonElement | undefined
}

async function settle() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

beforeEach(() => {
  mocks.auth.login.mockReset()
  mocks.auth.getQrcodeToken.mockReset().mockResolvedValue({
    uid: 'uid',
    time: '1',
    sign: 'sign',
    qrcode: 'value',
  })
  mocks.auth.getQrcodeStatus.mockReset().mockImplementation((_token, signal: AbortSignal) => (
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
  ))
  mocks.auth.getCaptchaSign.mockReset().mockResolvedValue('captcha-sign')
})

it('从账号登录错误进入点选验证码，并携带选择结果重试', async () => {
  mocks.auth.login
    .mockResolvedValueOnce({
      kind: 'captcha',
      code: 10098,
      message: '请输入验证码',
      raw: {},
    })
    .mockResolvedValueOnce({
      kind: 'error',
      code: 1,
      message: '测试结束',
      field: 'account',
      raw: {},
    })

  const root = document.createElement('div')
  const app = createApp(LoginPage)
  app.mount(root)
  await settle()

  button(root, '账号登录')?.click()
  await nextTick()

  const account = root.querySelector<HTMLInputElement>('[name="username"]')!
  const password = root.querySelector<HTMLInputElement>('[name="password"]')!
  account.value = '115'
  account.dispatchEvent(new Event('input', { bubbles: true }))
  password.value = 'secret'
  password.dispatchEvent(new Event('input', { bubbles: true }))
  root.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await settle()

  expect(root.querySelector('[data-title]')?.textContent).toBe('安全验证码')
  root.querySelector<HTMLButtonElement>('[title="选择候选文字 2"]')?.click()
  root.querySelector<HTMLButtonElement>('[title="选择候选文字 1"]')?.click()
  button(root, '确认验证')?.click()
  await settle()

  expect(mocks.auth.login).toHaveBeenCalledTimes(2)
  expect(mocks.auth.login.mock.calls[1]?.[0]).toMatchObject({
    account: '115',
    password: 'secret',
    captcha: { code: '10', sign: 'captcha-sign' },
  })

  app.unmount()
})
