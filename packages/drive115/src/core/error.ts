/**
 * 115 驱动错误码
 */
export enum Drive115ErrorCode {
  Unknown = 0,
  NotFoundM3u8File = 1,
  DecodeError = 2,
  SessionExpired = 990001,
  CaptchaRequired = 911,
}

/**
 * 115 驱动错误
 */
export class Drive115Error extends Error {
  /** 未找到 m3u8 文件 */
  static NotFoundM3u8File = class extends Drive115Error {
    constructor() {
      super('Not found m3u8 file', Drive115ErrorCode.NotFoundM3u8File)
    }
  }

  constructor(
    message: string,
    public code: Drive115ErrorCode,
    public cause?: unknown,
    public details?: { verifyUrl?: string },
  ) {
    super(message)
  }
}

/** UI 层所需的错误处理结果 */
export interface ErrorResult {
  message: string
  code: Drive115ErrorCode
  cause?: unknown
  details?: { verifyUrl?: string }
  /** UI 行动提示 */
  action: 'relogin' | 'verify' | 'retry' | 'none'
}

/** 统一错误处理：提取结构，判断行动 */
export function handleError(error: unknown): ErrorResult {
  if (error instanceof Drive115Error) {
    return {
      message: error.message,
      code: error.code,
      cause: error.cause,
      details: error.details,
      action: errorAction(error.code),
    }
  }
  if (error instanceof Error)
    return { message: error.message, code: Drive115ErrorCode.Unknown, action: 'none' }
  return { message: String(error), code: Drive115ErrorCode.Unknown, action: 'none' }
}

function errorAction(code: Drive115ErrorCode): ErrorResult['action'] {
  switch (code) {
    case Drive115ErrorCode.SessionExpired: return 'relogin'
    case Drive115ErrorCode.CaptchaRequired: return 'verify'
    case Drive115ErrorCode.DecodeError:
    case Drive115ErrorCode.NotFoundM3u8File:
      return 'retry'
    default: return 'none'
  }
}
