import { describe, expect, it } from 'vitest'
import { InfraError } from './InfraError'

describe('infraError', () => {
  it('stores url and statusCode', () => {
    const err = new InfraError('message', 'https://example.com', 500, true)
    expect(err.message).toBe('message')
    expect(err.url).toBe('https://example.com')
    expect(err.statusCode).toBe(500)
    expect(err.retryable).toBe(true)
    expect(err.name).toBe('InfraError')
  })

  it('defaults retryable to false', () => {
    const err = new InfraError('msg', 'https://e.com')
    expect(err.retryable).toBe(false)
    expect(err.statusCode).toBeUndefined()
  })

  it('is instance of Error', () => {
    expect(new InfraError('msg', 'https://e.com')).toBeInstanceOf(Error)
  })

  it('accepts cause', () => {
    const cause = new Error('root')
    const err = new InfraError('msg', 'https://e.com', 500, true, cause)
    expect(err.cause).toBe(cause)
  })
})
