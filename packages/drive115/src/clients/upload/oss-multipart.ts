import type { Res } from './index.ts'

/** OSS 分片上传操作所需的凭证 */
export interface OssCredentials {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
}

/** 已上传的分片信息 */
export interface UploadedPart {
  partNumber: number
  etag: string
}

/**
 * 计算 OSS REST API 签名（HMAC-SHA1）
 *
 * @see https://help.aliyun.com/zh/oss/developer-reference/signature-v1
 */
export async function ossSign(
  method: string,
  bucket: string,
  object: string,
  secret: string,
  date: string,
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
): Promise<string> {
  const contentMD5 = headers['Content-MD5'] || ''
  const contentType = headers['Content-Type'] || ''

  const canonicalHeaders = Object.entries(headers)
    .filter(([k]) => k.startsWith('x-oss-'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
    .join('\n')

  const canonicalResource = paramsStr(bucket, object, params)
  const stringToSign = `${method}\n${contentMD5}\n${contentType}\n${date}\n${canonicalHeaders}\n${canonicalResource}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function paramsStr(bucket: string, object: string, params: Record<string, string>): string {
  const qs = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => v ? `${k}=${v}` : k)
    .join('&')
  return `/${bucket}/${object}${qs ? `?${qs}` : ''}`
}

async function ossRequest(
  method: string,
  hostname: string,
  object: string,
  creds: OssCredentials,
  opts: {
    params?: Record<string, string>
    headers?: Record<string, string>
    body?: string | Uint8Array
  } = {},
): Promise<Response> {
  const bucket = hostname.split('.')[0]
  const baseHeaders: Record<string, string> = {
    ...opts.headers,
    'x-oss-security-token': creds.securityToken,
  }
  if (opts.body && !baseHeaders['Content-Length'])
    baseHeaders['Content-Length'] = String(opts.body.length)

  const date = new Date().toUTCString()
  // 浏览器禁止设置 Date header，用 x-oss-date 替代
  baseHeaders['x-oss-date'] = date
  const signature = await ossSign(method, bucket, object, creds.accessKeySecret, date, opts.params || {}, baseHeaders)

  const qs = opts.params
    ? `?${new URLSearchParams(opts.params).toString()}`
    : ''

  const url = `https://${hostname}/${encodeURI(object)}${qs}`
  const body = opts.body instanceof Uint8Array ? new Blob([opts.body as BlobPart]) : opts.body
  return fetch(url, {
    method,
    headers: {
      ...baseHeaders,
      Authorization: `OSS ${creds.accessKeyId}:${signature}`,
    },
    body,
  })
}

/**
 * 初始化 OSS 分片上传
 *
 * @returns UploadId
 */
export async function initMultipart(
  hostname: string,
  object: string,
  creds: OssCredentials,
): Promise<string> {
  const resp = await ossRequest('POST', hostname, object, creds, {
    params: { uploads: '' },
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  if (!resp.ok)
    throw new Error(`InitiateMultipartUpload failed: ${resp.status} ${await resp.text()}`)
  const xml = await resp.text()
  const uploadId = xml.match(/<UploadId>(.+?)<\/UploadId>/)?.[1]
  if (!uploadId)
    throw new Error(`InitiateMultipartUpload: UploadId not found in response: ${xml}`)
  return uploadId
}

/**
 * 上传单个分片
 *
 * @returns ETag
 */
export async function uploadPart(
  hostname: string,
  object: string,
  uploadId: string,
  partNumber: number,
  data: Uint8Array,
  creds: OssCredentials,
): Promise<string> {
  const resp = await ossRequest('PUT', hostname, object, creds, {
    params: { partNumber: String(partNumber), uploadId },
    headers: { 'Content-Type': 'application/octet-stream' },
    body: data,
  })
  if (!resp.ok)
    throw new Error(`UploadPart ${partNumber} failed: ${resp.status} ${await resp.text()}`)
  const etag = resp.headers.get('ETag')
  if (!etag)
    throw new Error(`UploadPart ${partNumber}: ETag not found in response`)
  return etag
}

/**
 * 合并所有分片，完成分片上传
 */
export async function completeMultipart(
  hostname: string,
  object: string,
  uploadId: string,
  parts: UploadedPart[],
  creds: OssCredentials,
): Promise<void> {
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<CompleteMultipartUpload>\n${
    sorted.map(p => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`).join('\n')
  }\n</CompleteMultipartUpload>`

  const resp = await ossRequest('POST', hostname, object, creds, {
    params: { uploadId },
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
  })
  if (!resp.ok)
    throw new Error(`CompleteMultipartUpload failed: ${resp.status} ${await resp.text()}`)
}

/**
 * 取消分片上传（清理未完成的分片）
 */
export async function abortMultipart(
  hostname: string,
  object: string,
  uploadId: string,
  creds: OssCredentials,
): Promise<void> {
  const resp = await ossRequest('DELETE', hostname, object, creds, {
    params: { uploadId },
  })
  if (!resp.ok)
    throw new Error(`AbortMultipartUpload failed: ${resp.status} ${await resp.text()}`)
}

/**
 * 从 StsToken + UploadInfo 构建 OSS hostname
 *
 * @example
 * ```ts
 * const hostname = ossHostname(uploadInfo)
 * // 'fhnfile.oss-cn-shenzhen.aliyuncs.com'
 * ```
 */
export function ossHostname(info: Res.UploadInfo): string {
  return `${info.bucket}.${info.endpoint}`
}
