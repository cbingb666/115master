type Info = Record<string | number, unknown>

/**
 * 请求 Range 范围
 */
export interface Range {
  /** 开始字节 */
  start: number
  /** 结束字节 */
  end: number
}

/**
 * IO 类 - 负责从URL获取指定范围的视频数据
 * 处理数据块的读取和管理
 */
export abstract class IO {
  /** 文件大小 */
  static size: number

  /** 文件时长 */
  static duration: number

  /** 打开文件 */
  abstract open(info: Info): Promise<void>

  /** 读取 */
  abstract read(range: Range): Promise<ArrayBuffer>

  /** 跳转 */
  abstract seek(time: number): Promise<void>
}
