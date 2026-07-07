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

describe('scoreFiles', () => {
  it('sets score to 4', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.scoreFiles({
      file_id: '3458739456796787776',
      score: 4,
    })

    expect(res.state).toBe(true)
    expect(res.code).toBe(0)
    expect(res.message).toBe('')
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toContain('/files/score')
    expect(post.mock.calls[0][1]).toEqual({
      data: {
        file_id: '3458739456796787776',
        score: 4,
      },
    })
  })

  it('clears score with score=0', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.scoreFiles({
      file_id: '3458739456796787776',
      score: 0,
    })

    expect(res.state).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][1]).toEqual({
      data: {
        file_id: '3458739456796787776',
        score: 0,
      },
    })
  })

  it('handles state=false', async () => {
    const { client } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: false,
        error: '设置失败',
      })),
    )

    const res = await client.scoreFiles({
      file_id: '3458739456796787776',
      score: 5,
    })

    expect(res.state).toBe(false)
    expect(res.code).toBe(0)
    expect(res.message).toBe('设置失败')
  })

  it('supports batch file IDs', async () => {
    const { client, post } = createClient(
      undefined,
      vi.fn().mockImplementation(() => jsonResponse({
        state: true,
        error: '',
        errno: '',
      })),
    )

    const res = await client.scoreFiles({
      file_id: 'id1,id2,id3',
      score: 3,
    })

    expect(res.state).toBe(true)
    expect(post.mock.calls[0][1]).toEqual({
      data: {
        file_id: 'id1,id2,id3',
        score: 3,
      },
    })
  })
})
