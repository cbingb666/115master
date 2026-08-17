import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { errorFeedback, formatError } from '../errorFeedback'

class MediaErrorStub {
  constructor(
    readonly code: number,
    readonly message: string,
  ) {}
}

const copy = vi.fn<(value: string) => Promise<void>>()
const notify = vi.fn()

beforeEach(() => {
  copy.mockResolvedValue()
  vi.stubGlobal('MediaError', MediaErrorStub)
  vi.stubGlobal('navigator', { clipboard: { writeText: copy } })
  vi.stubGlobal('alert', notify)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('error feedback adapter', () => {
  it('formats application and media errors outside the UI package', () => {
    expect(formatError(new Error('boom'))).toBe('Error: boom')
    expect(formatError(new MediaErrorStub(2, 'offline'))).toBe('Network Error')
    expect(formatError('failed')).toBe('failed')
  })

  it('adds the visible detail action only for Error instances', async () => {
    const error = new Error('boom')
    error.stack = 'stack'
    const feedback = errorFeedback(error)

    feedback.onDetail?.()

    expect(notify).toHaveBeenNthCalledWith(1, [
      '[Error name]: Error',
      '[Error message]: boom',
      '[Error stack]: stack',
    ].join('\n'))
    expect(copy).toHaveBeenCalledWith(expect.stringContaining('[Error message]: boom'))
    await vi.waitFor(() => expect(notify).toHaveBeenNthCalledWith(2, '已将错误信息复制到剪贴板'))
    expect(errorFeedback('failed')).toEqual({ message: 'failed' })
  })

  it('still displays details when clipboard access fails synchronously', () => {
    copy.mockImplementation(() => {
      throw new Error('denied')
    })

    errorFeedback(new Error('boom')).onDetail?.()

    expect(notify).toHaveBeenCalledWith(expect.stringContaining('[Error message]: boom'))
  })
})
