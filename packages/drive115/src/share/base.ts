/** 基础请求参数 */
export interface BaseParams {
  /** 返回格式 */
  format?: 'json'
}

/** 分页请求 */
export interface PaginationParams {
  /** 偏移量 */
  offset: number
  /** 限制数量 */
  limit: number
}

/** 排序 */
export interface Sorter {
  /** 排序方式 */
  o?: 'file_name' | 'user_utime' | 'user_ptime' | 'user_otime' | 'file_size'
  /** 是否升序 */
  asc?: 0 | 1
  /** 目录置顶 (是否混合排序) */
  fc_mix?: 0 | 1
}

/** 统一响应基类型 */
export type ApiResponseBase<T> = T & {
  state: boolean
  errNo?: number
  errcode?: number
  code?: number
  msg_code?: number
  error?: string
  error_msg?: string
  message?: string
}

/** 播放中的视频信息 */
export interface PlayingVideoInfo {
  /** 文件唯一标识 */
  pickCode: string
}
