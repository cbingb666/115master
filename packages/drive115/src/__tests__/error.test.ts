import { describe, expect, it } from 'vitest'
import { Drive115Error, Drive115ErrorCode } from '../error.ts'

describe('drive115Error', () => {
  it('should hold message, code, cause and details', () => {
    const error = new Drive115Error('session expired', Drive115ErrorCode.SessionExpired, 'cause', {
      verifyUrl: 'https://example.com',
    })

    expect(error.message).toBe('session expired')
    expect(error.code).toBe(Drive115ErrorCode.SessionExpired)
    expect(error.cause).toBe('cause')
    expect(error.details?.verifyUrl).toBe('https://example.com')
  })

  it('should be instance of Error', () => {
    const error = new Drive115Error('test', Drive115ErrorCode.Unknown)

    expect(error).toBeInstanceOf(Error)
  })

  it('should expose NotFoundM3u8File subclass', () => {
    const error = new Drive115Error.NotFoundM3u8File()

    expect(error).toBeInstanceOf(Drive115Error)
    expect(error.code).toBe(Drive115ErrorCode.NotFoundM3u8File)
  })
})
