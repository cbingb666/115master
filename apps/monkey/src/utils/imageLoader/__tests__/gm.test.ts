// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGMImageLoader } from '../gm'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheRemove: vi.fn(),
  compress: vi.fn(async (blob: Blob) => blob),
}))

vi.mock('@/utils/request/gmRequest', () => ({
  GMRequest: class {
    get = mocks.get
  },
}))

vi.mock('@/utils/cache/imageCache', () => ({
  imageCache: {
    get: mocks.cacheGet,
    set: mocks.cacheSet,
    remove: mocks.cacheRemove,
  },
}))

vi.mock('@115master/utils', () => ({
  image: { compress: mocks.compress },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.cacheGet.mockResolvedValue(null)
  mocks.cacheSet.mockResolvedValue(undefined)
  mocks.cacheRemove.mockResolvedValue(undefined)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:loaded'),
    revokeObjectURL: vi.fn(),
  })
})

describe('createGMImageLoader', () => {
  it('preserves the response MIME type and returns a disposable object URL', async () => {
    const blob = new Blob(['image'], { type: 'image/png' })
    mocks.get.mockResolvedValue({ ok: true, status: 200, blob: async () => blob })
    const loader = createGMImageLoader({ referer: 'https://ref', cache: false, transform: false })

    const result = await loader.load('https://image', new AbortController().signal)

    expect(mocks.get).toHaveBeenCalledWith('https://image', expect.objectContaining({
      headers: { Referer: 'https://ref' },
      responseType: 'blob',
    }))
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: 'image/png' }))
    result.dispose?.()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:loaded')
  })

  it('rejects unsuccessful responses before compression', async () => {
    mocks.get.mockResolvedValue({ ok: false, status: 404 })
    const loader = createGMImageLoader({ referer: 'https://ref' })

    await expect(loader.load('https://image', new AbortController().signal)).rejects.toThrow('404')
    expect(mocks.compress).not.toHaveBeenCalled()
  })

  it('separates cache entries by referer and transform version', () => {
    const first = createGMImageLoader({ referer: 'https://first' })
    const second = createGMImageLoader({ referer: 'https://second' })
    const original = createGMImageLoader({ referer: 'https://first', transform: false })

    expect(new Set([first.key, second.key, original.key])).toHaveLength(3)
  })

  it('refetches expired cache entries', async () => {
    mocks.cacheGet.mockResolvedValue({
      value: new Blob(['stale'], { type: 'image/webp' }),
      createdAt: 0,
      updatedAt: 0,
    })
    mocks.get.mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['fresh'], { type: 'image/png' }),
    })
    const loader = createGMImageLoader({ referer: 'https://ref', maxAge: 1 })

    await loader.load('https://image', new AbortController().signal)

    expect(mocks.cacheRemove).toHaveBeenCalledOnce()
    expect(mocks.get).toHaveBeenCalledOnce()
    expect(mocks.cacheSet).toHaveBeenCalledOnce()
  })

  it('passes cancellation to GMRequest', async () => {
    mocks.get.mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['image'], { type: 'image/png' }),
    })
    const signal = new AbortController().signal
    const loader = createGMImageLoader({ referer: 'https://ref', cache: false })

    await loader.load('https://image', signal)

    expect(mocks.get).toHaveBeenCalledWith('https://image', expect.objectContaining({ signal }))
  })
})
