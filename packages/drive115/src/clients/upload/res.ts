/** 上传初始化响应 (sampleinitupload.php 返回) */
export interface SampleInitUpload {
  /** OSS 对象键 */
  object: string
  /** OSS AccessKey ID (临时凭证) */
  accessid: string
  /** OSS 上传地址 */
  host: string
  /** OSS Policy (Base64) */
  policy: string
  /** OSS 签名 */
  signature: string
  /** 过期时间 (Unix timestamp) */
  expire: number
  /** OSS 回调配置 (Base64) */
  callback: string
}

/** 解码后的 OSS 回调配置 */
export interface OssCallback {
  /** 上传完成后的回调 URL */
  callbackUrl: string
  /** 回调请求体 (模板，含OSS变量如 ${sha1}, ${object}等) */
  callbackBody: string
  /** 回调请求体 Content-Type */
  callbackBodyType: string
}

/** OSS 上传完成后回调的响应 (samplecompleteupload.php) */
export interface SampleCompleteUpload {
  state: boolean
  message: string
  code: number
  data: {
    aid: number
    area_id: number
    cid: string
    file_name: string
    file_ptime: number
    file_status: number
    file_id: string
    file_size: string
    pick_code: string
    sha1: string
    sp: number
    file_type: number
    object_id: string
    user_id: string
    is_video: number
  }
}

/** OSS 上传所需的 multipart 参数 */
export interface OssUploadParams {
  /** OSS 对象键 */
  key: string
  /** OSS Policy */
  policy: string
  /** OSS AccessKey ID */
  OSSAccessKeyId: string
  /** 上传成功状态码 */
  success_action_status: '200'
  /** OSS 回调配置 (Base64) */
  callback: string
  /** OSS 签名 */
  signature: string
}

/** gettoken.php 返回的 STS 临时凭证 */
export interface StsToken {
  StatusCode: string
  AccessKeyId: string
  AccessKeySecret: string
  SecurityToken: string
  Expiration: string
}

/** getuploadinfo.php 返回的 OSS 上传配置 */
export interface UploadInfo {
  /** OSS endpoint，如 oss-cn-shenzhen.aliyuncs.com */
  endpoint: string
  /** OSS bucket 名称 */
  bucket: string
  /** 获取 token 的 URL */
  gettokenurl: string
}

/** OSS 分片上传状态 */
export interface PartState {
  partNumber: number
  start: number
  size: number
  status: 'pending' | 'uploading' | 'done' | 'failed'
  etag?: string
  retries: number
}
