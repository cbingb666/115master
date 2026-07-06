import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { Thunder } from './thunder.ts'

function createMockResponse(body: () => unknown): Response {
  return {
    json: body,
    blob: () => Promise.resolve(new Blob(['subtitle content'])),
    text: () => Promise.resolve(String(body())),
  } as Response
}

function createMockRequest(get: (url: string) => Promise<Response>): IRequest {
  return {
    get,
    post: vi.fn(),
    request: vi.fn(),
  } as unknown as IRequest
}

describe('subtitleSource.Thunder', () => {
  const keyword = 'movie.mp4'

  it('returns empty array for empty keyword', async () => {
    const request = createMockRequest(vi.fn())
    const thunder = new Thunder({ request })

    const result = await thunder.fetchSubtitle('')

    expect(result).toEqual([])
    expect(request.get).not.toHaveBeenCalled()
  })

  it('throws when API returns error code', async () => {
    const request = createMockRequest(vi.fn().mockResolvedValue(createMockResponse(() => ({ code: 1, result: 'error', data: [] }))))
    const thunder = new Thunder({ request })

    await expect(thunder.fetchSubtitle(keyword)).rejects.toThrow('Thunder API error')
  })

  it('returns processed subtitles sorted by score', async () => {
    const subtitleUrl = 'https://example.com/sub1.srt'
    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/oracle/subtitle')) {
        return Promise.resolve(createMockResponse(() => ({
          code: 0,
          result: 'ok',
          data: [
            {
              gcid: 'a',
              cid: '1',
              url: subtitleUrl,
              ext: 'srt',
              name: ' subtitle-a',
              duration: 1000,
              languages: ['zh-CN'],
              source: 1,
              score: 80,
              fingerprintf_score: 70,
              extra_name: 'extra-a',
              mt: 1,
            },
            {
              gcid: 'b',
              cid: '2',
              url: subtitleUrl,
              ext: 'ass',
              name: ' subtitle-b',
              duration: 1000,
              languages: ['zh-CN'],
              source: 1,
              score: 95,
              fingerprintf_score: 90,
              extra_name: 'extra-b',
              mt: 1,
            },
          ],
        })))
      }
      return Promise.resolve(createMockResponse(() => null))
    }))
    const thunder = new Thunder({ request })

    const result = await thunder.fetchSubtitle(keyword)

    expect(result).toHaveLength(2)
    expect(result[0].score).toBe(95)
    expect(result[1].score).toBe(80)
    expect(result[0].format).toBe('ass')
    expect(result[0].title).toBe(' subtitle-b')
  })

  it('filters out items that fail to download', async () => {
    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/oracle/subtitle')) {
        return Promise.resolve(createMockResponse(() => ({
          code: 0,
          result: 'ok',
          data: [
            {
              gcid: 'a',
              cid: '1',
              url: 'https://example.com/ok.srt',
              ext: 'srt',
              name: 'ok',
              duration: 1000,
              languages: ['zh-CN'],
              source: 1,
              score: 80,
              fingerprintf_score: 70,
              extra_name: '',
              mt: 1,
            },
            {
              gcid: 'b',
              cid: '2',
              url: 'https://example.com/fail.srt',
              ext: 'srt',
              name: 'fail',
              duration: 1000,
              languages: ['zh-CN'],
              source: 1,
              score: 90,
              fingerprintf_score: 80,
              extra_name: '',
              mt: 1,
            },
          ],
        })))
      }
      if (url.includes('fail')) {
        return Promise.reject(new Error('download failed'))
      }
      return Promise.resolve(createMockResponse(() => null))
    }))
    const thunder = new Thunder({ request })

    const result = await thunder.fetchSubtitle(keyword)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('ok')
  })

  it('throws when request fails', async () => {
    const request = createMockRequest(vi.fn().mockRejectedValue(new Error('network error')))
    const thunder = new Thunder({ request })

    await expect(thunder.fetchSubtitle(keyword)).rejects.toThrow('network error')
  })
})
