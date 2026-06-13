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
 */
export function normalizeResponse<T>(raw: unknown): Drive115Response<T> {
  if (!raw || typeof raw !== 'object') {
    throw new Drive115Error(
      `Invalid response: ${JSON.stringify(raw)}`,
      Drive115ErrorCode.DecodeError,
    )
  }

  const data = raw as Record<string, unknown>
  const state = Boolean(data.state)
  const code = Number(data.errNo ?? data.code ?? 0)
  const message = String(data.error ?? data.error_msg ?? '')

  return { ...data, state, code, message } as Drive115Response<T>
}
