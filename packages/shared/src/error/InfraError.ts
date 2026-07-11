/**
 * 基础设施层错误
 *
 * 携带请求上下文信息，用于区分网络层错误与业务层错误
 */
export class InfraError extends Error {
  declare cause?: unknown

  constructor(
    message: string,
    readonly url: string,
    readonly statusCode?: number,
    readonly retryable: boolean = false,
    cause?: unknown,
  ) {
    super(message)
    this.name = 'InfraError'
    if (cause !== undefined)
      this.cause = cause
  }
}
