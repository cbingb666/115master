import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { FileApiClient } from '../clients/file/client.ts'
import { Crypto115 } from '../core/crypto.ts'

function createMockRequest(get = vi.fn(), post = vi.fn()): IRequest {
  return { get, post, request: vi.fn() }
}

function jsonResponse(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify(data)))
}

function createClient(get = vi.fn(), post = vi.fn()) {
  const fetchRequest = createMockRequest(get, post)
  return {
    client: new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    }),
    get,
    post,
  }
}

const mockRbItem = {
  id: '3466995015190840819',
  file_name: 'test.mp4',
  type: '1' as const,
  file_size: '8554345579',
  dtime: '1783314012',
  status: '0' as const,
  cid: 0,
  parent_name: '根目录',
  iv: 1,
  vdi: 4,
  ico: 'mp4',
  u: '',
  play_long: 9334,
}

describe('getRbList', () => {
  it('fetches recycle bin list', async () => {
    const { client, get } = createClient(
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        count: '42',
        offset: 0,
        page_size: 115,
        order: 'dtime',
        is_asc: 0,
        rb_pass: 0,
        data: [mockRbItem],
      })),
    )

    const res = await client.getRbList({ aid: 7, cid: 0, offset: 0, limit: 115 })

    expect(res.state).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.data[0].file_name).toBe('test.mp4')
    expect(res.count).toBe('42')
    expect(res.rb_pass).toBe(0)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get.mock.calls[0][0]).toContain('/rb')
    expect(get.mock.calls[0][1]).toEqual({ params: { aid: 7, cid: 0, offset: 0, limit: 115 } })
  })

  it('handles state=false', async () => {
    const { client } = createClient(
      vi.fn().mockImplementation(() => jsonResponse({
        state: false,
        error: '获取失败',
        data: [],
      })),
    )

    const res = await client.getRbList({ aid: 7 })

    expect(res.state).toBe(false)
    expect(res.message).toBe('获取失败')
  })
})

describe('deleteFiles', () => {
  it('soft-deletes files (moves to recycle bin)', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.deleteFiles({
      pid: '3013116589290552633',
      'fid[0]': '3460275804229863111',
      'fid[1]': '3460273038497417148',
    })

    expect(res.state).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toContain('/rb/delete')
    expect(post.mock.calls[0][1]).toEqual({
      data: {
        pid: '3013116589290552633',
        'fid[0]': '3460275804229863111',
        'fid[1]': '3460273038497417148',
      },
    })
  })

  it('bypasses warning with ignore_warn', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.deleteFiles({
      pid: '3013116589290552633',
      'fid[0]': '3460275804229863111',
      ignore_warn: 1,
    })

    expect(res.state).toBe(true)
    expect(post.mock.calls[0][1].data.ignore_warn).toBe(1)
  })
})

describe('restoreRbFiles', () => {
  it('restores files from recycle bin', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.restoreRbFiles({
      'rid[0]': '3466995015190840819',
      'rid[1]': '3460275804229863111',
    })

    expect(res.state).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toContain('/rb/revert')
    expect(post.mock.calls[0][1]).toEqual({
      data: {
        'rid[0]': '3466995015190840819',
        'rid[1]': '3460275804229863111',
      },
    })
  })

  it('handles state=false', async () => {
    const { client } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: false,
        error: '还原失败',
        errno: '300001',
      })),
    )

    const res = await client.restoreRbFiles({
      'rid[0]': '3466995015190840819',
    })

    expect(res.state).toBe(false)
    expect(res.message).toBe('还原失败')
  })

  it('maps disk full error', async () => {
    const { client } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: false,
        error: '抱歉，还原失败！网盘空间不足！',
        errno: '300001',
      })),
    )

    const res = await client.restoreRbFiles({
      'rid[0]': '3466995015190840819',
    })

    expect(res.state).toBe(false)
    expect(res.message).toBe('抱歉，还原失败！网盘空间不足！')
  })
})

describe('cleanRbFiles', () => {
  it('permanently deletes files with password', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.cleanRbFiles({
      'rid[0]': '3460275804229863111',
      password: '947694',
    })

    expect(res.state).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toContain('/rb/clean')
    expect(post.mock.calls[0][1]).toEqual({
      data: {
        'rid[0]': '3460275804229863111',
        password: '947694',
      },
    })
  })

  it('handles invalid password', async () => {
    const { client } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: false,
        error: '安全密钥错误',
      })),
    )

    const res = await client.cleanRbFiles({
      'rid[0]': '3460275804229863111',
      password: '000000',
    })

    expect(res.state).toBe(false)
    expect(res.message).toBe('安全密钥错误')
  })
})

describe('cleanAllRbFiles', () => {
  it('clears entire recycle bin with password', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.cleanAllRbFiles({ password: '947694' })

    expect(res.state).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toContain('/rb/clean')
    expect(post.mock.calls[0][1]).toEqual({
      data: { password: '947694' },
    })
  })

  it('handles state=false', async () => {
    const { client } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: false,
        error: '安全密钥错误',
      })),
    )

    const res = await client.cleanAllRbFiles({ password: '000000' })

    expect(res.state).toBe(false)
    expect(res.message).toBe('安全密钥错误')
  })
})

describe('getRbInfo', () => {
  it('fetches file attributes from recycle bin', async () => {
    const { client, get } = createClient(
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        data: {
          file_name: 'test.mp4',
          file_size: '8554345579',
          dtime: '1783314012',
        },
      })),
    )

    const res = await client.getRbInfo({ rid: '3466995015190840819' })

    expect(res.state).toBe(true)
    expect(res.data.file_name).toBe('test.mp4')
    expect(get).toHaveBeenCalledTimes(1)
    expect(get.mock.calls[0][0]).toContain('/rb/rb_info')
    expect(get.mock.calls[0][1]).toEqual({ params: { rid: '3466995015190840819' } })
  })
})
