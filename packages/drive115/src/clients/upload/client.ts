import type { Req, Res } from './index.ts'
import { BaseApiClient } from '../base.ts'
import { URL_115 } from '../../share/constant.ts'
import { multipartStream, multipartBodySize } from './multipart.ts'

/**
 * 文件上传 API
 *
 * 上传流程：
 * 1. 调用 initUpload 获取 OSS 临时凭证
 * 2. 使用凭证将文件以 multipart/form-data 上传到 OSS
 * 3. OSS 在上传完成后自动回调 115 服务端完成登记
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

    if (params.file instanceof Blob) {
      const form = new FormData()
      form.append('key', info.object)
      form.append('policy', info.policy)
      form.append('OSSAccessKeyId', info.accessid)
      form.append('success_action_status', '200')
      form.append('callback', info.callback)
      form.append('signature', info.signature)
      form.append('file', params.file, params.filename)

      const resp = await this.fetchRequest.post(info.host, { body: form })
      return resp.json()
    }

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2)
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

    const resp = await this.fetchRequest.post(info.host, {
      body,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(cl),
      },
    })
    return resp.json()
  }
}
