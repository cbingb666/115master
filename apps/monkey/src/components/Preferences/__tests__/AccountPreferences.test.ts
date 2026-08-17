// @vitest-environment jsdom

import { beforeEach, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  execute: vi.fn(),
  logout: vi.fn(),
  showLogin: vi.fn(),
  user: {
    state: {
      data: {
        uid: 340263991,
        uname: '340263991',
        face: { face_l: '' },
        vip: {
          is_vip: true,
          desc: 'VIP 用户',
          expire_str: '2031-11-16',
        },
      },
    },
    isLoading: false,
    error: null,
  },
}))

vi.mock('@/app/dialog', () => ({
  useAppDialog: () => ({ confirm: mocks.confirm }),
}))
vi.mock('@/app/login', () => ({ showLogin: mocks.showLogin }))
vi.mock('@/store/userAq', () => ({
  useUserAqStore: () => ({ ...mocks.user, execute: mocks.execute }),
}))
vi.mock('@/utils/drive115Instance', () => ({
  drive115: { auth: { logout: mocks.logout } },
}))
vi.mock('@/icons', () => ({
  I: {
    ERROR: 'error',
    LOGOUT: 'logout',
    STAR_RATING: 'star',
  },
  Icon: defineComponent({ setup: () => () => h('i') }),
}))
vi.mock('@115master/ui', () => ({
  Button: defineComponent({
    setup: (_, { slots }) => () => h('button', slots.default?.()),
  }),
  Image: defineComponent({
    setup: (_, { slots }) => () => h('div', slots.fallback?.()),
  }),
}))

const { default: AccountPreferences } = await import('../AccountPreferences')

beforeEach(() => {
  mocks.confirm.mockReset().mockResolvedValue(false)
})

it('用户名等于 UID 时只显示一次 UID 数值', () => {
  const root = document.createElement('div')
  const app = createApp(AccountPreferences)
  app.mount(root)

  const values = [...root.querySelectorAll('p, dd')]
    .filter(item => item.textContent?.trim() === '340263991')

  expect(values).toHaveLength(1)
  expect(root.textContent).not.toContain('115 用户')
  expect(root.textContent).not.toContain('登录账号')
  expect(root.textContent).not.toContain('当前 MasterApp 使用的 115 账号。')
  app.unmount()
})

it('退出前使用简洁确认文案', async () => {
  const root = document.createElement('div')
  const app = createApp(AccountPreferences)
  app.mount(root)

  const button = [...root.querySelectorAll('button')]
    .find(item => item.textContent?.trim() === '退出登录')
  expect(root.querySelector('[data-account-preferences]')?.classList).toContain('h-full')
  expect(button?.parentElement?.classList).toContain('mt-auto')
  expect(button?.classList).toContain('w-full')
  expect(button?.classList).toContain('sm:w-auto')
  button?.click()
  await nextTick()

  expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({
    cancelText: '取消',
    content: '确定要退出账号吗？',
    confirmText: '确定',
  }))
  app.unmount()
})
