import { InfraError } from '@115master/shared'
import { describe, expect, it } from 'vitest'
import {
  decideAction,
  Drive115Error,
  Drive115ErrorCode,
  fromInfra,
  toDrive115Error,
  toResult,
} from '../core/error.ts'

describe('drive115Error', () => {
  it('携带 message / code / cause / details / url / retryable', () => {
    const error = new Drive115Error('session expired', Drive115ErrorCode.SessionExpired, {
      cause: 'cause',
      details: { verifyUrl: 'https://example.com' },
      url: 'https://115.com/api',
      retryable: true,
    })

    expect(error.message).toBe('session expired')
    expect(error.code).toBe(Drive115ErrorCode.SessionExpired)
    expect(error.cause).toBe('cause')
    expect(error.details?.verifyUrl).toBe('https://example.com')
    expect(error.url).toBe('https://115.com/api')
    expect(error.retryable).toBe(true)
  })

  it('retryable 默认 false', () => {
    expect(new Drive115Error('x', Drive115ErrorCode.Unknown).retryable).toBe(false)
  })

  it('是 Error 子类', () => {
    expect(new Drive115Error('x', Drive115ErrorCode.Unknown)).toBeInstanceOf(Error)
  })
})

describe('action getter（code + retryable 派生）', () => {
  it('sessionExpired -> relogin', () => {
    expect(new Drive115Error('x', Drive115ErrorCode.SessionExpired).action).toBe('relogin')
  })

  it('captchaRequired -> verify', () => {
    expect(new Drive115Error('x', Drive115ErrorCode.CaptchaRequired).action).toBe('verify')
  })

  it('decodeError / NotFoundM3u8File / NetworkError -> retry', () => {
    expect(new Drive115Error('x', Drive115ErrorCode.DecodeError).action).toBe('retry')
    expect(new Drive115Error('x', Drive115ErrorCode.NotFoundM3u8File).action).toBe('retry')
    expect(new Drive115Error('x', Drive115ErrorCode.NetworkError).action).toBe('retry')
  })

  it('unknown + retryable -> retry', () => {
    expect(new Drive115Error('x', Drive115ErrorCode.Unknown, { retryable: true }).action).toBe('retry')
  })

  it('unknown + 非 retryable -> none', () => {
    expect(new Drive115Error('x', Drive115ErrorCode.Unknown).action).toBe('none')
  })
})

describe('decideAction（全表）', () => {
  it('code 优先映射', () => {
    expect(decideAction(Drive115ErrorCode.SessionExpired, false)).toBe('relogin')
    expect(decideAction(Drive115ErrorCode.CaptchaRequired, false)).toBe('verify')
    expect(decideAction(Drive115ErrorCode.DecodeError, false)).toBe('retry')
    expect(decideAction(Drive115ErrorCode.NotFoundM3u8File, false)).toBe('retry')
    expect(decideAction(Drive115ErrorCode.NetworkError, false)).toBe('retry')
  })

  it('unknown 兜底：retryable 决定 retry / none', () => {
    expect(decideAction(Drive115ErrorCode.Unknown, true)).toBe('retry')
    expect(decideAction(Drive115ErrorCode.Unknown, false)).toBe('none')
  })
})

describe('fromInfra', () => {
  it('infraError -> Drive115Error(NetworkError)，透传 url / statusCode / retryable', () => {
    const infra = new InfraError('请求失败', 'https://115.com/api', 500, true)
    const err = fromInfra(infra)

    expect(err).toBeInstanceOf(Drive115Error)
    expect(err.code).toBe(Drive115ErrorCode.NetworkError)
    expect(err.url).toBe('https://115.com/api')
    expect(err.statusCode).toBe(500)
    expect(err.retryable).toBe(true)
    expect(err.cause).toBe(infra)
    expect(err.action).toBe('retry')
  })
})

describe('toDrive115Error（边界归一化）', () => {
  it('drive115Error 直通（同引用）', () => {
    const original = new Drive115Error('x', Drive115ErrorCode.DecodeError)
    expect(toDrive115Error(original)).toBe(original)
  })

  it('infraError -> NetworkError', () => {
    const err = toDrive115Error(new InfraError('net', 'https://115.com', undefined, true))
    expect(err.code).toBe(Drive115ErrorCode.NetworkError)
    expect(err.retryable).toBe(true)
  })

  it('未知 Error -> Unknown（保留 message）', () => {
    const err = toDrive115Error(new Error('boom'))
    expect(err.code).toBe(Drive115ErrorCode.Unknown)
    expect(err.message).toBe('boom')
    expect(err.retryable).toBe(false)
  })

  it('非 Error 值 -> Unknown（String 化）', () => {
    const err = toDrive115Error('oops')
    expect(err.code).toBe(Drive115ErrorCode.Unknown)
    expect(err.message).toBe('oops')
  })
})

describe('toResult（投影）', () => {
  it('drive115Error -> ErrorResult 纯数据', () => {
    const error = new Drive115Error('msg', Drive115ErrorCode.NetworkError, {
      url: 'https://115.com',
      statusCode: 500,
      retryable: true,
    })

    expect(toResult(error)).toEqual({
      message: 'msg',
      code: Drive115ErrorCode.NetworkError,
      action: 'retry',
      retryable: true,
      url: 'https://115.com',
      statusCode: 500,
      details: undefined,
    })
  })
})
