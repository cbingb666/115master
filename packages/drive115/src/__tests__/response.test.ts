import { describe, expect, it } from 'vitest'
import { normalizeResponse } from '../core/response.ts'

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

  it('throws for CaptchaRequired code with empty error', () => {
    const raw = { state: false, errNo: 911, error: '' }
    expect(() => normalizeResponse(raw)).toThrow('操作过于频繁')
  })

  it('maps error to message field', () => {
    const raw = { state: false, errNo: 500, error: '服务器错误' }
    const res = normalizeResponse<typeof raw>(raw)
    expect(res.message).toBe('服务器错误')
  })
})
