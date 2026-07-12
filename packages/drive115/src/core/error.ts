import { InfraError } from '@115master/shared'

/** UI 行动提示 */
export type Action = 'relogin' | 'verify' | 'retry' | 'none'

/**
 * 115 驱动错误码
 *
 * 正数为 115 后端 errNo；NetworkError 为客户端构造（网络层失败），取负数避免冲突。
 */
export enum Drive115ErrorCode {
  Unknown = 0,
  NotFoundM3u8File = 1,
  DecodeError = 2,
  SessionExpired = 990001,
  CaptchaRequired = 911,
  /** 网络层失败（来自 InfraError，可重试） */
  NetworkError = -1,
}

export interface Drive115ErrorOptions {
  cause?: unknown
  details?: { verifyUrl?: string }
  url?: string
  statusCode?: number
  retryable?: boolean
}

/**
 * 115 驱动错误：唯一对外失败类型
 *
 * 业务层错误（normalizeResponse / client 手动抛）与网络层错误（fromInfra 转换）
 * 都以此类型流出 handle，调用方无需 instanceof 分派。
 */
export class Drive115Error extends Error {
  declare cause?: unknown
  readonly code: Drive115ErrorCode
  readonly url?: string
  readonly statusCode?: number
  readonly retryable: boolean
  readonly details?: { verifyUrl?: string }

  constructor(
    message: string,
    code: Drive115ErrorCode,
    options: Drive115ErrorOptions = {},
  ) {
    super(message)
    this.name = 'Drive115Error'
    this.code = code
    this.url = options.url
    this.statusCode = options.statusCode
    this.retryable = options.retryable ?? false
    this.details = options.details
    if (options.cause !== undefined)
      this.cause = options.cause
  }

  /** 派生 UI 行动（基于 code + retryable，单一事实来源） */
  get action(): Action {
    return decideAction(this.code, this.retryable)
  }
}

/** UI 层所需的错误处理结果（Drive115Error 的纯数据投影，供 onError / 日志） */
export interface ErrorResult {
  message: string
  code: Drive115ErrorCode
  action: Action
  retryable: boolean
  url?: string
  statusCode?: number
  details?: { verifyUrl?: string }
}

/** action 决策：code 优先映射，retryable 兜底 */
export function decideAction(code: Drive115ErrorCode, retryable: boolean): Action {
  switch (code) {
    case Drive115ErrorCode.SessionExpired:
      return 'relogin'
    case Drive115ErrorCode.CaptchaRequired:
      return 'verify'
    case Drive115ErrorCode.DecodeError:
    case Drive115ErrorCode.NotFoundM3u8File:
    case Drive115ErrorCode.NetworkError:
      return 'retry'
    default:
      return retryable ? 'retry' : 'none'
  }
}

/** 边界转换：InfraError（网络层）→ Drive115Error(NetworkError) */
export function fromInfra(e: InfraError): Drive115Error {
  return new Drive115Error(e.message, Drive115ErrorCode.NetworkError, {
    url: e.url,
    statusCode: e.statusCode,
    retryable: e.retryable,
    cause: e,
  })
}

/** 边界归一化：任意抛出值 → Drive115Error（handle catch 入口） */
export function toDrive115Error(e: unknown): Drive115Error {
  if (e instanceof Drive115Error)
    return e
  if (e instanceof InfraError)
    return fromInfra(e)
  return new Drive115Error(
    e instanceof Error ? e.message : String(e),
    Drive115ErrorCode.Unknown,
    { cause: e instanceof Error ? e : undefined },
  )
}

/** 投影：Drive115Error → ErrorResult */
export function toResult(e: Drive115Error): ErrorResult {
  return {
    message: e.message,
    code: e.code,
    action: e.action,
    retryable: e.retryable,
    url: e.url,
    statusCode: e.statusCode,
    details: e.details,
  }
}
