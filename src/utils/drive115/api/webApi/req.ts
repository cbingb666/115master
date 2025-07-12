/** 获取文件列表 */
export interface GetFiles {
  pickcode?: string
  aid: number
  /** 目录id */
  cid: string
  /** 偏移量 */
  offset: number
  /** 限制数量 */
  limit: number
  /** 是否显示目录 */
  show_dir: number
  nf: string
  qid: number
  /** 1.文档；2.图片；3.音乐；4.视频；5.压缩；6.应用；7.书籍 */
  type: number
  source: string
  /** 返回格式 */
  format: string
  /** 是否星标 mark */
  star: string

  is_q: string
  is_share: string
  r_all: number
  /** 排序方式 */
  o: string
  /** 是否升序 */
  asc: number
  /** 当前页 */
  cur: number
  /** 是否自然排序 */
  natsort: number
}

/** 获取视频文件信息请求 */
export interface GetFilesVideo {
  pickcode: string
  share_id: string
  local: string
}

/** 文件星标状态 */
export enum MarkStatus {
  Mark = '1',
  Unmark = '0',
}

/** 文件星标请求 */
export interface FilesStar {
  file_id: string
  star: MarkStatus
}

/** 播放历史请求基础 */
interface FilesHistoryBase {
  category: '1'
  share_id: string
  pick_code: string
}

/** 获取播放历史请求 */
export type GetFilesHistory = FilesHistoryBase & {
  fetch: 'one'
}

/** 更新播放历史请求 */
export type PostFilesHistory = FilesHistoryBase & {
  op: 'update'
  time: number
  definition: '0'
}

/** 获取电影字幕请求 */
export interface GetMoviesSubtitle {
  pickcode: string
}
