import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  route: {
    value: {
      name: 'drive',
      fullPath: '/drive/all/0?page=2',
    },
  },
  replace: vi.fn(),
  user: vi.fn(),
}))

vi.mock('@/app/router', () => ({
  router: {
    currentRoute: mocks.route,
    replace: mocks.replace,
  },
}))

vi.mock('@/utils/drive115Instance', () => ({
  drive115: {
    user: {
      getUserAq: mocks.user,
    },
  },
}))

const { resolveLoginRedirect, showLogin } = await import('../login')
const { guardLogin } = await import('../guest')

beforeEach(() => {
  mocks.route.value = {
    name: 'drive',
    fullPath: '/drive/all/0?page=2',
  }
  mocks.replace.mockReset().mockResolvedValue(undefined)
  mocks.user.mockReset().mockResolvedValue({ state: false })
})

describe('登录路由', () => {
  it('只接受站内且非登录页的回跳地址', () => {
    expect(resolveLoginRedirect('/video/pick-code')).toBe('/video/pick-code')
    expect(resolveLoginRedirect(['/tags', null])).toBe('/tags')
    expect(resolveLoginRedirect('https://example.com')).toBe('/')
    expect(resolveLoginRedirect('//example.com')).toBe('/')
    expect(resolveLoginRedirect('/login?redirect=/drive')).toBe('/')
  })

  it('已登录时拒绝进入登录页并回跳', async () => {
    mocks.user.mockResolvedValue({ state: true })

    await expect(guardLogin('/video/pick-code')).resolves.toBe('/video/pick-code')
  })

  it('未登录或登录态检测失败时允许进入登录页', async () => {
    await expect(guardLogin(null)).resolves.toBe(true)

    mocks.user.mockRejectedValue(new Error('network error'))
    await expect(guardLogin(null)).resolves.toBe(true)
  })

  it('会话失效时保留当前页面并跳转登录页', async () => {
    await showLogin('请重新登录')

    expect(mocks.replace).toHaveBeenCalledWith({
      name: 'login',
      query: {
        reason: '请重新登录',
        redirect: '/drive/all/0?page=2',
      },
    })
  })

  it('已在登录页时不重复导航', async () => {
    mocks.route.value = { name: 'login', fullPath: '/login' }

    await showLogin()

    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('会话失效发起的登录导航不受已登录守卫拦截', async () => {
    mocks.user.mockResolvedValue({ state: true })
    mocks.replace.mockImplementation(async () => {
      await expect(guardLogin(null)).resolves.toBe(true)
      expect(mocks.user).not.toHaveBeenCalled()
    })

    await showLogin()
  })
})
