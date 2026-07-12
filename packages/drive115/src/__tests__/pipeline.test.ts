import type { IRequest } from '@115master/shared'
import type { ErrorResult } from '../core/error.ts'
import { InfraError } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { FileApiClient } from '../clients/file/client.ts'
import { Crypto115 } from '../core/crypto.ts'
import { Drive115ErrorCode } from '../core/error.ts'

function createMockRequest(get = vi.fn(), post = vi.fn()): IRequest {
  return { get, post, request: vi.fn() }
}

describe('handle 边界：InfraError -> Drive115Error 转换', () => {
  it('网络层失败归一化为 NetworkError，并经 onError 投影通知', async () => {
    const infra = new InfraError('请求失败', 'https://115.com/api', undefined, true)
    const fetchRequest = createMockRequest(
      vi.fn().mockImplementation(() => Promise.reject(infra)),
    )
    const onError = vi.fn()
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
      onError,
    })

    await expect(client.getFiles({} as never)).rejects.toMatchObject({
      code: Drive115ErrorCode.NetworkError,
      retryable: true,
      action: 'retry',
      url: 'https://115.com/api',
    })

    expect(onError).toHaveBeenCalledTimes(1)
    const result = onError.mock.calls[0]?.[0] as ErrorResult
    expect(result.code).toBe(Drive115ErrorCode.NetworkError)
    expect(result.action).toBe('retry')
    expect(result.retryable).toBe(true)
    expect(result.url).toBe('https://115.com/api')
  })

  it('业务层 Drive115Error（SessionExpired）直通，action=relogin 通知 onError', async () => {
    const fetchRequest = createMockRequest(
      vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ state: false, errNo: 990001 })))),
    )
    const onError = vi.fn()
    const client = new FileApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
      onError,
    })

    await expect(client.getFiles({} as never)).rejects.toMatchObject({
      code: Drive115ErrorCode.SessionExpired,
      action: 'relogin',
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect((onError.mock.calls[0]?.[0] as ErrorResult).action).toBe('relogin')
  })
})
