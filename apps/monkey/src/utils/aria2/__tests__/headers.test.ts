import type { Aria2Settings } from '../types'
import { describe, expect, it } from 'vitest'
import { buildAria2Headers } from '../headers'
import { ARIA2_DEFAULT_SETTINGS } from '../types'

const base: Aria2Settings = {
  ...ARIA2_DEFAULT_SETTINGS,
  userAgent: 'custom-ua',
  referer: 'https://115.com',
}

describe('buildAria2Headers', () => {
  it('useBrowserUA=true 使用传入的 browserUserAgent', () => {
    const h = buildAria2Headers({
      settings: { ...base, useBrowserUA: true },
      cookie: 'a=1',
      browserUserAgent: 'browser-ua',
    })
    expect(h).toContain('User-Agent: browser-ua')
  })

  it('useBrowserUA=false 使用 settings.userAgent', () => {
    const h = buildAria2Headers({
      settings: { ...base, useBrowserUA: false },
      cookie: 'a=1',
      browserUserAgent: 'browser-ua',
    })
    expect(h).toContain('User-Agent: custom-ua')
  })

  it('包含 Referer 和 Cookie', () => {
    const h = buildAria2Headers({
      settings: base,
      cookie: 'UID=xxx; CID=yyy',
      browserUserAgent: 'b',
    })
    expect(h).toContain('Referer: https://115.com')
    expect(h).toContain('Cookie: UID=xxx; CID=yyy')
  })

  it('extraHeaders 每行一条，空行和无冒号行忽略', () => {
    const h = buildAria2Headers({
      settings: { ...base, extraHeaders: 'X-A: 1\n\nnot-a-header\nX-B: 2' },
      cookie: '',
      browserUserAgent: 'b',
    })
    expect(h).toContain('X-A: 1')
    expect(h).toContain('X-B: 2')
    expect(h).not.toContain('not-a-header')
  })

  it('cookie 为空时不输出 Cookie 行', () => {
    const h = buildAria2Headers({
      settings: base,
      cookie: '',
      browserUserAgent: 'b',
    })
    expect(h.some(line => line.startsWith('Cookie:'))).toBe(false)
  })
})
