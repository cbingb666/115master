import type { IRequest } from '@115master/shared'
import type { z } from 'zod'
import type { M115EncodeResult } from '../core/crypto.ts'
import type { Drive115CoreDeps } from '../core/deps.ts'
import type { Drive115Response } from '../core/response.ts'
import { normalizeResponse } from '../core/response.ts'

/**
 * 领域 Client 基类
 */
export class BaseApiClient {
  protected deps: Drive115CoreDeps

  constructor(deps: Drive115CoreDeps) {
    this.deps = deps
  }

  protected get crypto115() {
    return this.deps.crypto115
  }

  protected get fetchRequest(): IRequest {
    return this.deps.fetchRequest
  }

  protected get proApiRequest(): IRequest {
    return this.deps.proApiRequest
  }

  /** 统一响应处理：normalizeResponse + onError 拦截 */
  protected async handle<T>(
    payload: Promise<unknown>,
    schema?: z.ZodType<T>,
  ): Promise<Drive115Response<T>> {
    try {
      return normalizeResponse<T>(await payload, schema)
    }
    catch (e) {
      if (e instanceof Error)
        await this.deps.onError?.(e)
      throw e
    }
  }

  /** Pro API 通用编码 */
  protected proApiEncodeData(data: object): { tm: string, encoded: M115EncodeResult, encodedData: string } {
    const tm = Math.floor(Date.now() / 1000).toString()
    const src = JSON.stringify(data)
    const encoded = this.crypto115.m115_encode(src, tm)
    const encodedData = `data=${encodeURIComponent(encoded.data)}`
    return {
      tm,
      encoded,
      encodedData,
    }
  }
}
