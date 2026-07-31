import { PRO_API_URL_115, UPLOAD_URL_115 } from '@/constants/115'
import { appLogger } from '@/utils/logger'
import { GMRequest } from '@/utils/request/gmRequst'

/** 日志 */
const logger = appLogger.sub('drive115-upload')

/**
 * 上传专用请求实例
 * @description 禁用缓存，放宽超时时间
 */
const uploadRequest = new GMRequest({ cache: 'no-cache', timeout: 20000 }, 'gm-upload-cache')

/**
 * 上传用户信息
 */
export interface UploadInfo {
  /** 用户 id */
  userId: string
  /** 用户密钥 */
  userKey: string
}

/**
 * 采样上传初始化返回
 * @description OSS PostObject 直传所需的表单参数（由 115 服务端签名生成）
 */
interface SampleInitUploadResponse {
  /** OSS 上传主机 */
  host: string
  /** OSS 对象键 */
  object: string
  /** OSS 回调（base64） */
  callback: string
  /** OSS 策略（base64） */
  policy: string
  /** OSS 签名 */
  signature: string
  /** OSS AccessKeyId */
  accessid: string
  /** 过期时间 */
  expire?: number
  /** 状态（错误时可能返回） */
  state?: boolean
  /** 错误码 */
  code?: number
  /** 错误信息 */
  message?: string
  /** 错误信息 */
  error?: string
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 文件 id */
  fileId: string
  /** 文件名 */
  fileName: string
  /** 文件提取码 */
  pickCode: string
  /** sha1 */
  sha1: string
  /** 目录 id */
  cid: string
}

/**
 * 获取上传用户信息
 * @description 通过 cookie 会话获取当前用户的 user_id / userkey
 */
export async function getUploadInfo(): Promise<UploadInfo> {
  const response = await uploadRequest.get(
    new URL('/app/uploadinfo', PRO_API_URL_115).href,
  )
  const json = (await response.json()) as {
    state: boolean
    user_id: number | string
    userkey: string
    error?: string
  }

  if (!json.state || !json.user_id) {
    throw new Error(`获取上传信息失败: ${JSON.stringify(json)}`)
  }

  return {
    userId: String(json.user_id),
    userKey: json.userkey,
  }
}

/**
 * 采样上传初始化
 * @description 请求 115 服务端为本次上传生成 OSS 直传表单参数（非秒传，直接上传到 OSS）
 * @param userId 用户 id
 * @param filename 文件名
 * @param filesize 文件大小（字节）
 * @param targetCid 目标目录 id
 */
async function sampleInitUpload(
  userId: string,
  filename: string,
  filesize: number,
  targetCid: string,
): Promise<SampleInitUploadResponse> {
  const response = await uploadRequest.post(
    new URL('/3.0/sampleinitupload.php', UPLOAD_URL_115).href,
    {
      data: {
        userid: userId,
        filename,
        filesize: String(filesize),
        target: `U_1_${targetCid}`,
      },
    },
  )

  const json = (await response.json()) as SampleInitUploadResponse

  if (!json.host || !json.object) {
    throw new Error(
      `初始化上传失败: ${json.message || json.error || JSON.stringify(json)}`,
    )
  }

  return json
}

/**
 * OSS PostObject 直传
 * @description 使用 115 返回的表单参数将文件以 multipart/form-data 直传到 OSS，
 * 成功后 OSS 会回调 115 完成入库，并返回文件信息
 * @param init 采样上传初始化返回
 * @param blob 文件数据
 * @param filename 文件名
 */
async function ossPostObject(
  init: SampleInitUploadResponse,
  blob: Blob,
  filename: string,
): Promise<UploadResult> {
  /** 强制使用 https，避免混合内容问题 */
  const host = init.host.replace(/^http:/, 'https:')

  const formData = new FormData()
  formData.append('name', filename)
  formData.append('key', init.object)
  formData.append('policy', init.policy)
  formData.append('OSSAccessKeyId', init.accessid)
  formData.append('success_action_status', '200')
  formData.append('callback', init.callback)
  formData.append('signature', init.signature)
  /** file 字段必须放在最后 */
  formData.append('file', blob, filename)

  const response = await uploadRequest.request(host, {
    method: 'POST',
    body: formData,
    cache: 'no-cache',
    timeout: 60000,
  })

  const json = (await response.json()) as {
    state: boolean
    code?: number
    message?: string
    data?: {
      file_id: string
      file_name: string
      cid: string
      pick_code: string
      sha1: string
    }
  }

  if (!json.state || !json.data) {
    throw new Error(`上传失败: ${json.message || JSON.stringify(json)}`)
  }

  return {
    fileId: json.data.file_id,
    fileName: json.data.file_name,
    pickCode: json.data.pick_code,
    sha1: json.data.sha1,
    cid: json.data.cid,
  }
}

/**
 * 上传文件到指定目录（采样上传）
 * @description 完整的上传流程：获取用户信息 -> 初始化上传 -> OSS 直传
 * @param blob 文件数据
 * @param filename 文件名
 * @param targetCid 目标目录 id
 */
export async function uploadFileSample(
  blob: Blob,
  filename: string,
  targetCid: string,
): Promise<UploadResult> {
  logger.info('开始上传', { filename, targetCid, size: blob.size })
  const info = await getUploadInfo()
  const init = await sampleInitUpload(info.userId, filename, blob.size, targetCid)
  const result = await ossPostObject(init, blob, filename)
  logger.info('上传完成', result)
  return result
}
