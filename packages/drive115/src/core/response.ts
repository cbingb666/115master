import type { z } from 'zod'
import { Drive115Error, Drive115ErrorCode } from './error.ts'

/**
 * 统一响应类型
 *
 * 保留后端原始字段，同时收敛错误字段到 code / message
 */
export type Drive115Response<T> = T & {
  state: boolean
  code: number
  message: string
}

/**
 * 将后端不一致的响应形状收敛为 Drive115Response
 *
 * 同时执行通用错误码检查（SessionExpired 等）和可选的 Zod schema 校验
 */
export function normalizeResponse<T>(
  raw: unknown,
  schema?: z.ZodType<T>,
): Drive115Response<T> {
  if (!raw || typeof raw !== 'object') {
    throw new Drive115Error(
      `Invalid response: ${JSON.stringify(raw)}`,
      Drive115ErrorCode.DecodeError,
    )
  }

  const data = raw as Record<string, unknown>
  const state = Boolean(data.state)
  const code = Number(data.errNo ?? data.code ?? 0)
  const message
    = typeof data.error === 'string' && data.error.length > 0
      ? data.error
      : typeof data.error_msg === 'string'
        ? data.error_msg
        : ''

  // 通用错误码检查
  if (code === Drive115ErrorCode.SessionExpired) {
    throw new Drive115Error('登录已过期，请重新登录', Drive115ErrorCode.SessionExpired)
  }

  if (code === Drive115ErrorCode.CaptchaRequired) {
    throw new Drive115Error(
      message || '操作过于频繁，请通过人机验证',
      Drive115ErrorCode.CaptchaRequired,
    )
  }

  // Schema 校验
  if (schema) {
    const parsed = schema.safeParse(data)
    if (!parsed.success) {
      throw new Drive115Error(
        `Response validation failed: ${parsed.error.message}`,
        Drive115ErrorCode.DecodeError,
        parsed.error,
      )
    }
    return { ...parsed.data, state, code, message } as Drive115Response<T>
  }

  return { ...data, state, code, message } as Drive115Response<T>
}
