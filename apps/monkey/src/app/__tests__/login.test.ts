import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  route: {
    value: {
      name: 'drive',
      fullPath: '/drive/all/0?page=2',
    },
  },
  replace: vi.fn(),
}))

vi.mock('@/app/router', () => ({
  router: {
    currentRoute: mocks.route,
    replace: mocks.replace,
  },
}))

const { resolveLoginRedirect, showLogin } = await import('../login')

beforeEach(() => {
  mocks.route.value = {
    name: 'drive',
    fullPath: '/drive/all/0?page=2',
  }
  mocks.replace.mockReset().mockResolvedValue(undefined)
})

describe('登录路由', () => {
  it('只接受站内且非登录页的回跳地址', () => {
    expect(resolveLoginRedirect('/video/pick-code')).toBe('/video/pick-code')
    expect(resolveLoginRedirect(['/tags', null])).toBe('/tags')
    expect(resolveLoginRedirect('https://example.com')).toBe('/')
    expect(resolveLoginRedirect('//example.com')).toBe('/')
    expect(resolveLoginRedirect('/login?redirect=/drive')).toBe('/')
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
})
