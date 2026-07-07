import type { ApiResponseBase } from '../../share/base.ts'

/** 解压状态 */
export interface ExtractStatus {
  /** 状态码：0=未开始 1=解压中 2=异常 3=失败 4=已完成 6=需要密码 7=不支持 */
  unzip_status: number
  /** 进度 0-100 */
  progress: number
}

/** 查询解压状态 (GET) */
export type PushExtract = ApiResponseBase<{
  data: {
    extract_status: ExtractStatus
  }
}>

/** 发起解压/提交密码 (POST) — 响应仅有 unzip_status，无 progress */
export type PushExtractPost = ApiResponseBase<{
  data: {
    unzip_status: number
  }
}>

/** 解压文件列表项 */
export interface ExtractFileItem {
  /** 0=目录 1=文件 */
  file_category: 0 | 1
  /** 文件名 */
  file_name: string
  /** 文件大小 */
  size: number
  /** 修改时间 */
  time: string
}

/** 浏览解压文件列表 */
export type ExtractInfo = ApiResponseBase<{
  data: {
    list: ExtractFileItem[]
    /** 是否还有更多页 */
    has_file: string
    /** 下一页游标 */
    next_marker: string
  }
}>

/** 保存解压文件到网盘 */
export type AddExtractFile = ApiResponseBase<{
  data: {
    /** 保存任务 ID，用于轮询进度 */
    extract_id: string
  }
}>

/** 轮询文件保存进度 */
export type AddExtractProgress = ApiResponseBase<{
  data: {
    /** 进度 0-100 */
    percent: number
  }
}>

/** 解压后的文件夹内容项 */
export interface ExtractFolderItem {
  /** 路径 */
  pt: string
  /** 文件名 */
  fn: string
}

/** 获取解压文件夹内容 */
export type ExtractFoldersGet = ApiResponseBase<{
  data: ExtractFolderItem[]
}>

/** 验证解压文件数量 */
export type ExtractFoldersVerify = ApiResponseBase<{
  data: {
    /** 是否在限制内 */
    limit_state: boolean
  }
}>

/** 获取解压文件下载链接 */
export type ExtractDownFile = ApiResponseBase<{
  data: {
    /** 下载链接 */
    url: string
    /** 302 跳转链接（需二次请求） */
    file_url_302?: string
  }
}>
