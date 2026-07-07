import type { Res } from './index.ts'
import type { UploadApiClient } from './client.ts'
import type { OssCredentials, UploadedPart } from './oss-multipart.ts'
import * as Oss from './oss-multipart.ts'

/** 分片上传状态 */
export type UploadState = 'idle' | 'uploading' | 'paused' | 'completed' | 'aborted'

/** 进度信息 */
export interface Progress {
  completed: number
  total: number
  percent: number
}

/** 分片状态 */
export interface PartState {
  partNumber: number
  start: number
  size: number
  status: 'pending' | 'uploading' | 'done' | 'failed'
  etag?: string
  retries: number
}

/** 可序列化的上传会话 */
export interface UploadSession {
  filename: string
  filesize: number
  userid: string
  target: string
  hostname: string
  objectKey: string
  uploadId: string
  token: Res.StsToken
  pickcode: string
  partSize: number
  parts: PartState[]
}

/** 文件数据源 */
export interface FileSource {
  size: number
  read(offset: number, length: number): Promise<Uint8Array>
}

/**
 * OSS 分片上传管理器
 *
 * 支持暂停/恢复/断点续传的大文件上传。
 *
 * @example
 * ```ts
 * const upload = new MultipartUpload({
 *   source: new NodeFileSource('/path/to/large.rar'),
 *   filename: 'large.rar',
 *   userid: '340263991',
 *   target: uploadTarget(1, 0),
 *   client: drive115.upload,
 * })
 * upload.onProgress = (p) => console.log(`${p.percent}%`)
 * const result = await upload.start()
 * ```
 */
export class MultipartUpload {
  private source: FileSource
  private client: UploadApiClient
  private params: { filename: string, filesize: number, userid: string, target: string }
  private partSize: number
  private concurrency: number
  private maxRetries: number

  private _state: UploadState = 'idle'
  private _token?: Res.StsToken
  private _hostname?: string
  private _objectKey?: string
  private _uploadId?: string
  private _pickcode?: string
  private _parts: PartState[] = []
  private _abort?: AbortController

  onProgress?: (progress: Progress) => void
  onPartComplete?: (part: PartState) => void
  onPartFailed?: (part: PartState, error: Error) => void

  constructor(opts: {
    source: FileSource
    filename: string
    userid: string
    target: string
    client: UploadApiClient
    partSize?: number
    concurrency?: number
    maxRetries?: number
    onProgress?: (progress: Progress) => void
    onPartComplete?: (part: PartState) => void
    onPartFailed?: (part: PartState, error: Error) => void
  }) {
    this.source = opts.source
    this.client = opts.client
    this.params = {
      filename: opts.filename,
      filesize: opts.source.size,
      userid: opts.userid,
      target: opts.target,
    }
    this.partSize = opts.partSize ?? 10 * 1024 * 1024 // 10MB
    this.concurrency = opts.concurrency ?? 3
    this.maxRetries = opts.maxRetries ?? 3
    this.onProgress = opts.onProgress
    this.onPartComplete = opts.onPartComplete
    this.onPartFailed = opts.onPartFailed
  }

  get state(): UploadState { return this._state }

  get parts(): readonly PartState[] { return this._parts }

  /** 导出会话（用于持久化断点续传） */
  get session(): UploadSession | null {
    if (!this._token || !this._hostname || !this._objectKey || !this._uploadId || !this._pickcode)
      return null
    return {
      ...this.params,
      hostname: this._hostname,
      objectKey: this._objectKey,
      uploadId: this._uploadId,
      token: this._token,
      pickcode: this._pickcode,
      partSize: this.partSize,
      parts: this._parts,
    }
  }

  /** 从会话恢复 */
  static async resume(
    session: UploadSession,
    source: FileSource,
    client: UploadApiClient,
    opts?: { concurrency?: number, maxRetries?: number },
  ): Promise<MultipartUpload> {
    const upload = new MultipartUpload({
      source,
      filename: session.filename,
      userid: session.userid,
      target: session.target,
      client,
      partSize: session.partSize,
      concurrency: opts?.concurrency,
      maxRetries: opts?.maxRetries,
    })
    upload._token = session.token
    upload._hostname = session.hostname
    upload._objectKey = session.objectKey
    upload._uploadId = session.uploadId
    upload._pickcode = session.pickcode
    upload._parts = session.parts
    upload._state = 'paused'
    return upload
  }

  /** 开始上传 */
  async start(): Promise<Res.SampleCompleteUpload> {
    if (this._state === 'uploading')
      throw new Error('Upload is already in progress')
    if (this._state === 'completed')
      throw new Error('Upload is already completed')

    this._state = 'uploading'
    this._abort = new AbortController()

    // Step 1: 获取 STS 凭证
    if (!this._token)
      this._token = await this.client.getToken(this.params)

    // Step 2: 获取 OSS 配置
    if (!this._hostname) {
      const info = await this.client.getUploadInfo({ userid: this.params.userid })
      this._hostname = Oss.ossHostname(info)
    }

    const creds: OssCredentials = {
      accessKeyId: this._token.AccessKeyId,
      accessKeySecret: this._token.AccessKeySecret,
      securityToken: this._token.SecurityToken,
    }

    // Step 3: 初始化分片上传
    if (!this._uploadId) {
      this._objectKey = this._objectKey || `${this.params.filename}.${Date.now()}`
      this._uploadId = await Oss.initMultipart(this._hostname, this._objectKey, creds)
    }

    // 初始化分片列表
    if (this._parts.length === 0)
      this._parts = this.buildParts()

    // Step 4: 上传分片
    const pending = this._parts.filter(p => p.status === 'pending' || p.status === 'failed')
    await this.uploadParts(pending, creds)

    // 检查是否全部完成
    const allDone = this._parts.every(p => p.status === 'done')
    if (!allDone) {
      this._state = 'paused'
      throw new Error('Upload paused, not all parts completed')
    }

    // Step 5: 合并分片
    if (!this._hostname || !this._objectKey || !this._uploadId)
      throw new Error('Upload state corrupted: missing hostname/objectKey/uploadId')
    const hostname = this._hostname
    const objectKey = this._objectKey
    const uploadId = this._uploadId

    const uploaded: UploadedPart[] = this._parts.map(p => ({
      partNumber: p.partNumber,
      etag: p.etag!,
    }))
    await Oss.completeMultipart(hostname, objectKey, uploadId, uploaded, creds)

    // Step 6: 通知 115
    const result = await this.client.resumeUpload({
      ...this.params,
      pickcode: this._pickcode || objectKey,
      object: objectKey,
      uploadId,
    })

    this._state = 'completed'
    return result
  }

  /** 暂停上传 */
  pause(): void {
    if (this._state !== 'uploading')
      return
    this._abort?.abort()
    this._state = 'paused'
  }

  /** 取消上传 */
  async abort(): Promise<void> {
    this.pause()
    if (this._hostname && this._objectKey && this._uploadId && this._token) {
      const creds: OssCredentials = {
        accessKeyId: this._token.AccessKeyId,
        accessKeySecret: this._token.AccessKeySecret,
        securityToken: this._token.SecurityToken,
      }
      await Oss.abortMultipart(this._hostname, this._objectKey, this._uploadId, creds)
    }
    this._state = 'aborted'
  }

  private buildParts(): PartState[] {
    const parts: PartState[] = []
    const count = Math.ceil(this.params.filesize / this.partSize)
    for (let i = 0; i < count; i++) {
      parts.push({
        partNumber: i + 1,
        start: i * this.partSize,
        size: Math.min(this.partSize, this.params.filesize - i * this.partSize),
        status: 'pending',
        retries: 0,
      })
    }
    return parts
  }

  private async uploadParts(parts: PartState[], creds: OssCredentials): Promise<void> {
    const signal = this._abort?.signal
    let cursor = 0

    const next = async (): Promise<void> => {
      while (cursor < parts.length) {
        if (signal?.aborted)
          return
        const part = parts[cursor++]
        await this.uploadOnePart(part, creds)
      }
    }

    const workers = Array.from({ length: this.concurrency }, () => next())
    await Promise.all(workers)
  }

  private async uploadOnePart(
    part: PartState,
    creds: OssCredentials,
  ): Promise<void> {
    const hostname = this._hostname
    const objectKey = this._objectKey
    const uploadId = this._uploadId
    if (!hostname || !objectKey || !uploadId)
      return

    while (part.retries <= this.maxRetries) {
      try {
        part.status = 'uploading'
        this.emitProgress()

        const data = await this.source.read(part.start, part.size)
        const etag = await Oss.uploadPart(
          hostname, objectKey, uploadId,
          part.partNumber, data, creds,
        )

        part.status = 'done'
        part.etag = etag
        this.emitProgress()
        this.onPartComplete?.(part)
        return
      }
      catch (e) {
        part.retries++
        if (part.retries > this.maxRetries) {
          part.status = 'failed'
          this.emitProgress()
          this.onPartFailed?.(part, e instanceof Error ? e : new Error(String(e)))
          return
        }
      }
    }
  }

  private emitProgress(): void {
    const done = this._parts.filter(p => p.status === 'done').length
    this.onProgress?.({
      completed: done,
      total: this._parts.length,
      percent: Math.round((done / this._parts.length) * 100),
    })
  }
}
