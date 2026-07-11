import type { Req, Res } from './index.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'
import { multipartBodySize, multipartStream } from './multipart.ts'

/**
 * 文件上传 API
 *
 * 上传流程：
 * 1. 调用 initUpload 获取 OSS 临时凭证
 * 2. 使用凭证将文件以 multipart/form-data 上传到 OSS
 * 3. OSS 在上传完成后自动回调 115 服务端完成登记
 *
 * 分片上传流程（大文件，支持断点续传）：
 * 1. POST gettoken.php         → 获取 STS 临时凭证
 * 2. POST getuploadinfo.php    → 获取 OSS endpoint
 * 3. OSS InitiateMultipartUpload → 获取 UploadId
 * 4. OSS UploadPart × N        → 逐片上传（可暂停/重试）
 * 5. OSS CompleteMultipartUpload → 合并分片
 * 6. POST resumeupload.php     → 通知 115 上传完成
 */
export class UploadApiClient extends BaseApiClient {
  /**
   * 初始化上传，获取 OSS 临时凭证
   *
   * @example
   * ```ts
   * const ossInfo = await drive115.upload.initUpload({
   *   userid: '100000001',
   *   filename: 'test.txt',
   *   filesize: 1024,
   *   target: UploadApiClient.target(1, 0),
   * })
   *
   * // 拿到凭证后，用 form-data 上传文件到 OSS：
   * const form = new FormData()
   * form.append('key', ossInfo.data.object)
   * form.append('policy', ossInfo.data.policy)
   * form.append('OSSAccessKeyId', ossInfo.data.accessid)
   * form.append('success_action_status', '200')
   * form.append('callback', ossInfo.data.callback)
   * form.append('signature', ossInfo.data.signature)
   * form.append('file', fileBlob)
   * await fetch(ossInfo.data.host, { method: 'POST', body: form })
   * ```
   */
  async initUpload(params: Req.SampleInitUpload): Promise<Res.SampleInitUpload> {
    const body = new URLSearchParams()
    body.append('userid', params.userid)
    body.append('filename', params.filename)
    body.append('filesize', String(params.filesize))
    body.append('target', params.target)

    const resp = await this.fetchRequest.post(
      new URL('/3.0/sampleinitupload.php', URL_115.UPLB).href,
      {
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )
    return resp.json()
  }

  /**
   * 获取 STS 临时凭证（用于 OSS REST API 分片上传）
   *
   * @example
   * ```ts
   * const token = await drive115.upload.getToken({
   *   userid: '340263991',
   *   filename: 'large.rar',
   *   filesize: 2_000_000_000,
   *   target: uploadTarget(1, 0),
   * })
   * // token.AccessKeyId, token.AccessKeySecret, token.SecurityToken
   * ```
   */
  async getToken(params: Req.GetToken): Promise<Res.StsToken> {
    const body = new URLSearchParams()
    body.append('userid', params.userid)
    body.append('filename', params.filename)
    body.append('filesize', String(params.filesize))
    body.append('target', params.target)

    const resp = await this.fetchRequest.post(
      new URL('/3.0/gettoken.php', URL_115.UPLB).href,
      {
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )
    return resp.json()
  }

  /**
   * 获取 OSS 上传配置（endpoint + bucket + token URL）
   *
   * @example
   * ```ts
   * const info = await drive115.upload.getUploadInfo({ userid: '340263991' })
   * // info.endpoint: 'oss-cn-shenzhen.aliyuncs.com'
   * // info.bucket: 'fhnfile'
   * ```
   */
  async getUploadInfo(params: Req.GetUploadInfo): Promise<Res.UploadInfo> {
    const body = new URLSearchParams()
    body.append('userid', params.userid)

    const resp = await this.fetchRequest.post(
      new URL('/3.0/getuploadinfo.php', URL_115.UPLB).href,
      {
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )
    return resp.json()
  }

  /**
   * 通知 115 分片上传完成
   *
   * OSS 分片合并后调用此接口通知 115 服务端。
   *
   * @example
   * ```ts
   * const result = await drive115.upload.resumeUpload({
   *   userid: '340263991',
   *   filename: 'large.rar',
   *   filesize: 2_000_000_000,
   *   target: uploadTarget(1, 0),
   *   pickcode: '...',
   *   object: 'xxx.bin',
   *   uploadId: '...',
   * })
   * ```
   */
  async resumeUpload(params: Req.ResumeUpload): Promise<Res.SampleCompleteUpload> {
    const body = new URLSearchParams()
    body.append('userid', params.userid)
    body.append('filename', params.filename)
    body.append('filesize', String(params.filesize))
    body.append('target', params.target)
    body.append('pickcode', params.pickcode)
    body.append('object', params.object)
    body.append('uploadId', params.uploadId)

    const resp = await this.fetchRequest.post(
      new URL('/3.0/resumeupload.php', URL_115.UPLB).href,
      {
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )
    return resp.json()
  }

  /**
   * 根据上传响应生成 OSS 上传所需的 multipart 参数
   */
  buildOssParams(uploadInfo: Res.SampleInitUpload): Res.OssUploadParams {
    return {
      key: uploadInfo.object,
      policy: uploadInfo.policy,
      OSSAccessKeyId: uploadInfo.accessid,
      success_action_status: '200',
      callback: uploadInfo.callback,
      signature: uploadInfo.signature,
    }
  }

  /**
   * 上传文件到 115 网盘
   *
   * 封装完整的三步流程：初始化 → OSS 上传 → 回调登记
   *
   * @example
   * ```ts
   * // Blob 方式（浏览器 / 小文件）
   * const result = await drive115.upload.upload({
   *   file: new Blob(['hello']),
   *   filename: 'hello.txt',
   *   userid: '100000001',
   *   target: uploadTarget(1, 0),
   * })
   *
   * // ReadableStream 方式（Node.js / 大文件）
   * const stream = fs.createReadStream('large.rar').toWebStream()
   * const result = await drive115.upload.upload({
   *   file: stream,
   *   filename: 'large.rar',
   *   userid: '100000001',
   *   target: uploadTarget(1, 0),
   *   filesize: fs.statSync('large.rar').size,
   * })
   * // result.data.file_id, result.data.pick_code, result.data.sha1
   * ```
   */
  async upload(params: Req.UploadFile): Promise<Res.SampleCompleteUpload> {
    const fs = params.filesize ?? (params.file instanceof Blob ? params.file.size : undefined)
    if (fs === undefined)
      throw new Error('filesize is required when file is a ReadableStream')

    const info = await this.initUpload({
      userid: params.userid,
      filename: params.filename,
      filesize: fs,
      target: params.target,
    })

    /** OSS 返回 XML（不是 JSON），解析 PostResponse 确认成功 */
    function buildForm(file: Blob | File) {
      const form = new FormData()
      form.append('key', info.object)
      form.append('policy', info.policy)
      form.append('OSSAccessKeyId', info.accessid)
      form.append('success_action_status', '200')
      form.append('callback', info.callback)
      form.append('signature', info.signature)
      form.append('file', file, params.filename)
      return form
    }

    if (params.file instanceof Blob) {
      const form = buildForm(params.file)
      const resp = await this.proApiRequest.request(info.host, { method: 'POST', body: form })
      return parseOssResponse(resp, info)
    }

    const boundary = `----WebKitFormBoundary${Math.random().toString(36).slice(2)}`
    const fields = [
      { name: 'key', value: info.object },
      { name: 'policy', value: info.policy },
      { name: 'OSSAccessKeyId', value: info.accessid },
      { name: 'success_action_status', value: '200' },
      { name: 'callback', value: info.callback },
      { name: 'signature', value: info.signature },
    ]

    const body = multipartStream(fields, params.file, params.filename, boundary)
    const cl = multipartBodySize(fields, fs, params.filename, boundary)

    const resp = await this.proApiRequest.request(info.host, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(cl),
      },
    })
    return parseOssResponse(resp, info)
  }
}

/** 解析 OSS PostResponse XML，构造上传结果 */
async function parseOssResponse(resp: Response, info: Res.SampleInitUpload): Promise<Res.SampleCompleteUpload> {
  const xml = await resp.text()
  if (!resp.ok)
    throw new Error(`OSS upload failed: ${resp.status} ${xml}`)

  const etag = xml.match(/<ETag>(.+?)<\/ETag>/)?.[1] || ''
  const key = xml.match(/<Key>(.+?)<\/Key>/)?.[1] || info.object
  const loc = xml.match(/<Location>(.+?)<\/Location>/)?.[1] || ''

  return {
    state: true,
    message: '',
    code: 0,
    data: {
      aid: 1,
      area_id: 1,
      cid: '0',
      file_name: '',
      file_ptime: Math.floor(Date.now() / 1000),
      file_status: 1,
      file_id: key,
      file_size: '0',
      pick_code: etag.replace(/"/g, ''),
      sha1: key,
      sp: 0,
      file_type: 0,
      object_id: loc,
      user_id: '',
      is_video: 0,
    },
  }
}
