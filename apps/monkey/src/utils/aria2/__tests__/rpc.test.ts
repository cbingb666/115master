import { describe, expect, it, vi } from 'vitest'

vi.mock('$', () => ({
  GM_info: { userAgentData: { brands: [] } },
  GM_xmlhttpRequest: vi.fn(),
  GM_getValue: vi.fn(),
  GM_setValue: vi.fn(),
}))

const { buildAddUriPayload, parseRpcUrl } = await import('../rpc')

describe('parseRpcUrl', () => {
  it('无认证', () => {
    const r = parseRpcUrl('http://localhost:6800/jsonrpc')
    expect(r.endpoint).toBe('http://localhost:6800/jsonrpc')
    expect(r.auth).toBeUndefined()
    expect(r.options).toEqual({})
  })

  it('token 认证', () => {
    const r = parseRpcUrl('http://token:mysecret@localhost:6800/jsonrpc')
    expect(r.endpoint).toBe('http://localhost:6800/jsonrpc')
    expect(r.auth).toEqual({ mode: 'token', token: 'token:mysecret' })
  })

  it('basic 认证', () => {
    const r = parseRpcUrl('http://alice:p%40ss@host:6800/jsonrpc')
    expect(r.endpoint).toBe('http://host:6800/jsonrpc')
    expect(r.auth?.mode).toBe('basic')
    expect(r.auth && r.auth.mode === 'basic' && r.auth.header).toBe(
      `Basic ${btoa('alice:p@ss')}`,
    )
  })

  it('fragment options', () => {
    const r = parseRpcUrl(
      'http://localhost:6800/jsonrpc#split=10&max-connection-per-server=5',
    )
    expect(r.options).toEqual({
      'split': '10',
      'max-connection-per-server': '5',
    })
  })

  it('fragment 空值视为 enabled', () => {
    const r = parseRpcUrl('http://localhost:6800/jsonrpc#continue')
    expect(r.options).toEqual({ continue: 'enabled' })
  })
})

describe('buildAddUriPayload', () => {
  const base = {
    url: 'https://dl.115.com/file.mp4',
    out: 'foo/bar.mp4',
    headers: ['User-Agent: ua', 'Referer: https://115.com'],
    downloadPath: '',
    sha1: undefined as string | undefined,
    sha1Check: false,
    fragmentOptions: {} as Record<string, string>,
  }

  it('最小载荷', () => {
    const parsed = parseRpcUrl('http://localhost:6800/jsonrpc')
    const payload = buildAddUriPayload(parsed, base)
    expect(payload.jsonrpc).toBe('2.0')
    expect(payload.method).toBe('aria2.addUri')
    expect(typeof payload.id).toBe('number')
    expect(payload.params[0]).toEqual(['https://dl.115.com/file.mp4'])
    const opts = payload.params[1] as Record<string, unknown>
    expect(opts.out).toBe('foo/bar.mp4')
    expect(opts.header).toEqual(base.headers)
    expect(opts.dir).toBeUndefined()
    expect(opts.checksum).toBeUndefined()
  })

  it('token 认证前置 params', () => {
    const parsed = parseRpcUrl('http://token:xxx@localhost:6800/jsonrpc')
    const payload = buildAddUriPayload(parsed, base)
    expect(payload.params[0]).toBe('token:xxx')
    expect(payload.params[1]).toEqual(['https://dl.115.com/file.mp4'])
  })

  it('basic 认证不改 params', () => {
    const parsed = parseRpcUrl('http://a:b@localhost:6800/jsonrpc')
    const payload = buildAddUriPayload(parsed, base)
    expect(payload.params[0]).toEqual(['https://dl.115.com/file.mp4'])
  })

  it('downloadPath 映射为 dir', () => {
    const parsed = parseRpcUrl('http://localhost:6800/jsonrpc')
    const payload = buildAddUriPayload(parsed, {
      ...base,
      downloadPath: '/downloads',
    })
    const opts = payload.params[payload.params.length - 1] as Record<
      string,
      unknown
    >
    expect(opts.dir).toBe('/downloads')
  })

  it('sha1Check+sha1 填充 checksum', () => {
    const parsed = parseRpcUrl('http://localhost:6800/jsonrpc')
    const payload = buildAddUriPayload(parsed, {
      ...base,
      sha1: 'abc',
      sha1Check: true,
    })
    const opts = payload.params[payload.params.length - 1] as Record<
      string,
      unknown
    >
    expect(opts.checksum).toBe('sha-1=abc')
  })

  it('sha1Check=true 但 sha1 缺失 → 不加 checksum', () => {
    const parsed = parseRpcUrl('http://localhost:6800/jsonrpc')
    const payload = buildAddUriPayload(parsed, {
      ...base,
      sha1: undefined,
      sha1Check: true,
    })
    const opts = payload.params[payload.params.length - 1] as Record<
      string,
      unknown
    >
    expect(opts.checksum).toBeUndefined()
  })

  it('fragmentOptions 合并到末尾 options', () => {
    const parsed = parseRpcUrl('http://localhost:6800/jsonrpc#split=10')
    const payload = buildAddUriPayload(parsed, {
      ...base,
      fragmentOptions: parsed.options,
    })
    const opts = payload.params[payload.params.length - 1] as Record<
      string,
      unknown
    >
    expect(opts.split).toBe('10')
  })
})
