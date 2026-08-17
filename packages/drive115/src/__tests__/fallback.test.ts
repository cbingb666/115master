import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { FileApiClient } from '../clients/file/client.ts'
import { Crypto115 } from '../core/crypto.ts'
import { Drive115Error } from '../core/error.ts'

function createMockRequest(get = vi.fn(), post = vi.fn()): IRequest {
  return {
    get,
    post,
    request: vi.fn(),
  }
}

function jsonResponse(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify(data)))
}

describe('fileApiClient.getFilesWithFallback', () => {
  it('returns primary response when state is true', async () => {
    const fetchRequest = createMockRequest(
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        errNo: 0,
        error: '',
        order: 'file_name',
        is_asc: 1,
        data: [{ n: 'primary' }],
      })),
    )
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    })

    const res = await client.getFilesWithFallback({} as never)

    expect(res.state).toBe(true)
    expect(res.data?.[0]?.n).toBe('primary')
    expect(fetchRequest.get).toHaveBeenCalledTimes(1)
  })

  it('forwards the abort signal to primary and fallback requests', async () => {
    const fetchRequest = createMockRequest(
      vi.fn()
        .mockImplementationOnce(() => jsonResponse({
          state: false,
          errNo: 1,
          error: 'fail',
          order: 'user_utime',
          is_asc: 0,
        }))
        .mockImplementationOnce(() => jsonResponse({
          state: true,
          errNo: 0,
          error: '',
          order: 'user_utime',
          is_asc: 0,
          data: [],
        })),
    )
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    })
    const controller = new AbortController()

    await client.getFilesWithFallback({} as never, controller.signal)

    expect(fetchRequest.get).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
    expect(fetchRequest.get).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it('does not start the fallback request after cancellation', async () => {
    const controller = new AbortController()
    const fetchRequest = createMockRequest(vi.fn().mockImplementation(() => {
      controller.abort()
      return jsonResponse({ state: false, errNo: 1, error: 'cancelled' })
    }))
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    })

    await expect(client.getFilesWithFallback({} as never, controller.signal)).rejects.toThrow()
    expect(fetchRequest.get).toHaveBeenCalledTimes(1)
  })

  it('falls back to APS when primary fails', async () => {
    const fetchRequest = createMockRequest(
      vi.fn()
        .mockImplementationOnce(() => jsonResponse({
          state: false,
          errNo: 1,
          error: 'fail',
          order: 'user_utime',
          is_asc: 0,
        }))
        .mockImplementationOnce(() => jsonResponse({
          state: true,
          errNo: 0,
          error: '',
          order: 'user_utime',
          is_asc: 0,
          data: [{ n: 'fallback' }],
        })),
    )
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    })

    const res = await client.getFilesWithFallback({} as never)

    expect(res.state).toBe(true)
    expect(res.data?.[0]?.n).toBe('fallback')
    expect(fetchRequest.get).toHaveBeenCalledTimes(2)
  })

  it('throws when both primary and fallback fail', async () => {
    const fetchRequest = createMockRequest(
      vi.fn().mockImplementation(() => jsonResponse({
        state: false,
        errNo: 1,
        error: 'fail',
        order: 'file_name',
        is_asc: 1,
      })),
    )
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    })

    await expect(client.getFilesWithFallback({} as never)).rejects.toThrow(Drive115Error)
    await expect(client.getFilesWithFallback({} as never)).rejects.toThrow('获取播放列表失败')
  })
})

describe('fileApiClient.searchFiles', () => {
  it('forwards the abort signal', async () => {
    const fetchRequest = createMockRequest(
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        count: 0,
        data: [],
        order: 'file_name',
        is_asc: 1,
        offset: 0,
        cur: 1,
      })),
    )
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    })
    const controller = new AbortController()

    await client.searchFiles({} as never, controller.signal)

    expect(fetchRequest.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
