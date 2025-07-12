/** 文件夹名称 */
type FolderName = string
/** 女演员名称 */
type ActressName = string

/** 女演员图片信息 */
export interface ActressImageInfo {
  /** 内容 */
  Content: Record<FolderName, Record<ActressName, string>>
  /** 信息 */
  Information: {
    /** 总数 */
    TotalNum: number
    /** 总大小 */
    TotalSize: number
    /** 时间戳 */
    Timestamp: number
  }
}

/** 女演员图片映射 */
export type ActressImageMap = Map<
  string,
  {
    /** 文件夹 */
    folder: string
    /** 文件名 */
    filename: string
    /** 时间戳 */
    timestamp: number
  }[]
>
