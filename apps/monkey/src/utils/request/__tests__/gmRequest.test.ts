import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GMRequest } from '../gmRequest'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  abort: vi.fn(),
}))

vi.mock('vite-plugin-monkey/dist/client', () => ({
  GM_info: { userAgentData: { brands: [] } },
  GM_xmlhttpRequest: mocks.request,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.request.mockImplementation((options) => {
    mocks.abort.mockImplementation(() => options.onabort?.())
    return { abort: mocks.abort }
  })
})

describe('gm request', () => {
  it('aborts the underlying request when its signal is cancelled', async () => {
    const controller = new AbortController()
    const pending = new GMRequest().get('https://example.com/image', {
      signal: controller.signal,
    })

    controller.abort()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(mocks.abort).toHaveBeenCalledOnce()
  })
})
