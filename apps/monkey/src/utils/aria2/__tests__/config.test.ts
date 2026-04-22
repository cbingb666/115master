import { beforeEach, describe, expect, it, vi } from 'vitest'

import { readSettings, subscribeSettings, writeSettings } from '../config'
import { ARIA2_DEFAULT_SETTINGS } from '../types'

const store = new Map<string, unknown>()

vi.mock('$', () => ({
  GM_getValue: (k: string) => store.get(k),
  GM_setValue: (k: string, v: unknown) => { store.set(k, v) },
}))

beforeEach(() => {
  store.clear()
})

describe('aria2 config', () => {
  it('首次读取返回默认值', () => {
    expect(readSettings()).toEqual(ARIA2_DEFAULT_SETTINGS)
  })

  it('写入后读取一致', () => {
    writeSettings({ intervalMs: 500, downloadPath: '/tmp' })
    const s = readSettings()
    expect(s.intervalMs).toBe(500)
    expect(s.downloadPath).toBe('/tmp')
    expect(s.rpcList).toEqual([])
  })

  it('写入后 GM 存储包含完整字段', () => {
    writeSettings({ intervalMs: 500 })
    expect(store.get('ARIA2_SETTINGS')).toMatchObject({
      ...ARIA2_DEFAULT_SETTINGS,
      intervalMs: 500,
    })
  })

  it('subscribeSettings 在 writeSettings 后被调用', () => {
    const cb = vi.fn()
    subscribeSettings(cb)
    writeSettings({ downloadPath: '/a' })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb.mock.calls[0][0].downloadPath).toBe('/a')
  })

  it('subscribeSettings 返回 unsubscribe 可取消', () => {
    const cb = vi.fn()
    const un = subscribeSettings(cb)
    un()
    writeSettings({ downloadPath: '/b' })
    expect(cb).not.toHaveBeenCalled()
  })
})
