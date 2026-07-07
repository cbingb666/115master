/** 上传初始化请求参数 */
export interface SampleInitUpload {
  /** 用户ID */
  userid: string
  /** 文件名 */
  filename: string
  /** 文件大小 (字节) */
  filesize: number
  /** 上传目标标识 */
  target: string
}

/** 上传目标类型 */
export enum UploadTarget {
  /** 普通文件上传 (aid=1) */
  File = 1,
  /** 图片上传 (aid=2) */
  Image = 2,
  /** 音乐上传 (aid=3) */
  Music = 3,
  /** 视频上传 (aid=4) */
  Video = 4,
  /** 压缩包上传 (aid=5) */
  Archive = 5,
  /** 应用上传 (aid=9) */
  App = 9,
  /** 特殊上传 (aid=999，如头像上传) */
  Special = 999,
}

/**
 * 生成上传目标标识
 * @param aid - 空间ID
 * @param cid - 目录ID，默认为 0（根目录）
 * @returns 目标标识字符串，如 "U_1_0"
 */
export function uploadTarget(aid: number, cid: string | number = 0): string {
  return `U_${aid}_${cid}`
}

/**
 * 生成共享文件夹上传目标标识
 * @param cid - 共享文件夹ID
 */
export function shareTarget(cid: string): string {
  return cid
}

/** upload() 方法的入参 */
export interface UploadFile {
  /** 文件 Blob 或 ReadableStream（流式上传时需同时提供 filesize） */
  file: Blob | ReadableStream<Uint8Array>
  /** 文件名 */
  filename: string
  /** 用户ID */
  userid: string
  /** 上传目标标识，通过 uploadTarget() 生成 */
  target: string
  /** 文件大小（字节），file 为 ReadableStream 时必填 */
  filesize?: number
}
