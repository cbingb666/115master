import { describe, expect, it } from 'vitest'
import { normalizeResponse } from '../response.ts'

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
    const raw = { state: false, code: 911, errNo: 911, error: '', error_msg: 'captcha' }
    const res = normalizeResponse<typeof raw>(raw)

    expect(res.state).toBe(false)
    expect(res.code).toBe(911)
    expect(res.message).toBe('captcha')
  })

  it('prefers errNo over code', () => {
    const raw = { state: false, errNo: 990001, code: 500, error: 'login' }
    const res = normalizeResponse<typeof raw>(raw)

    expect(res.code).toBe(990001)
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
})
