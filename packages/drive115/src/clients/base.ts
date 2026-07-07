import type { IRequest } from '@115master/shared'
import type { M115EncodeResult } from '../core/crypto.ts'
import type { Drive115CoreDeps } from '../core/deps.ts'

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
