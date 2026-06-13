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
