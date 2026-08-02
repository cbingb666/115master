import { describe, expect, it } from 'vitest'
import { Drive115Error } from '../core/error.ts'
import { normalizeResponse } from '../core/response.ts'

function captchaError(raw: unknown) {
  try {
    normalizeResponse(raw)
  }
  catch (error) {
    expect(error).toBeInstanceOf(Drive115Error)
    return error as Drive115Error
  }

  throw new Error('Expected normalizeResponse to throw')
}

describe('normalizeResponse', () => {
  it('maps webApi shape to state/code/message', () => {
    const raw = { state: true, errNo: 0, error: '', count: 10 }
    const res = normalizeResponse<typeof raw>(raw)

    expect(res.state).toBe(true)
    expect(res.code).toBe(0)
    expect(res.message).toBe('')
    expect(res.count).toBe(10)
  })

  it('maps normalApi shape using code and error_msg', () => {
    const raw = { state: false, code: 500, errNo: 500, error: '', error_msg: '服务器错误' }
    const res = normalizeResponse<typeof raw>(raw)

    expect(res.state).toBe(false)
    expect(res.code).toBe(500)
    expect(res.message).toBe('服务器错误')
  })

  it('prefers errNo over code', () => {
    const raw = { state: false, errNo: 404, code: 500, error: 'not found' }
    const res = normalizeResponse<typeof raw>(raw)

    expect(res.code).toBe(404)
  })

  it('prefers error over error_msg', () => {
    const raw = { state: false, error: 'first', error_msg: 'second' }
    const res = normalizeResponse<typeof raw>(raw)

    expect(res.message).toBe('first')
  })

  it('throws for non-object responses', () => {
    expect(() => normalizeResponse(null)).toThrow('Invalid response')
    expect(() => normalizeResponse('string')).toThrow('Invalid response')
  })

  it('throws for SessionExpired code', () => {
    const raw = { state: false, errNo: 990001, error: 'expired' }
    expect(() => normalizeResponse(raw)).toThrow('登录已过期')
  })

  it('throws for CaptchaRequired code', () => {
    const raw = { state: false, errNo: 911, error: 'captcha' }
    expect(() => normalizeResponse(raw)).toThrow('captcha')
  })

  it('carries the response verification URL for CaptchaRequired', () => {
    const error = captchaError({
      state: false,
      errcode: 911,
      data: { url: 'https://captchaapi.115.com/custom?token=abc' },
    })

    expect(error.details?.verifyUrl).toBe('https://captchaapi.115.com/custom?token=abc')
  })

  it('uses the web captcha URL when CaptchaRequired has no URL', () => {
    const error = captchaError({ state: false, msg_code: 911 })

    expect(error.details?.verifyUrl).toBe(
      'https://captchaapi.115.com/?ac=security_code&type=web',
    )
  })

  it('throws for CaptchaRequired code with empty error', () => {
    const raw = { state: false, errNo: 911, error: '' }
    expect(() => normalizeResponse(raw)).toThrow('操作过于频繁')
  })

  it('maps error to message field', () => {
    const raw = { state: false, errNo: 500, error: '服务器错误' }
    const res = normalizeResponse<typeof raw>(raw)
    expect(res.message).toBe('服务器错误')
  })

  it('uses message when legacy error fields are absent', () => {
    const raw = { state: false, code: 500, message: '请稍后重试' }
    const res = normalizeResponse<typeof raw>(raw)

    expect(res.message).toBe('请稍后重试')
  })
})
