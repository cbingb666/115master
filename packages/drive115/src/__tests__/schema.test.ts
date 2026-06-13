import { describe, expect, it } from 'vitest'
import { DownloadResultSchema } from '../schemas.ts'

describe('downloadResultSchema', () => {
  it('accepts valid download result', () => {
    const data = {
      url: {
        url: 'https://example.com/file.mp4',
        auth_cookie: {
          expire: '1234567890',
          name: 'SEID',
          path: '/',
          value: 'abc',
        },
      },
    }
    const result = DownloadResultSchema.safeParse(data)

    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data.url.url).toBe('https://example.com/file.mp4')
  })

  it('accepts result without auth_cookie', () => {
    const data = { url: { url: 'https://example.com/file.mp4' } }
    const result = DownloadResultSchema.safeParse(data)

    expect(result.success).toBe(true)
  })

  it('rejects missing url', () => {
    const data = { url: {} }
    const result = DownloadResultSchema.safeParse(data)

    expect(result.success).toBe(false)
  })
})
