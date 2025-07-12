export enum FileType {
  // 文件夹
  folder = '0',
  // 文件
  file = '1',
}

/** 是否视频 */
export enum IvType {
  // 是
  Yes = '1',
}

export interface FileItemAttributes {
  c: string
  /** 目录id */
  cid: string
  /** 是否视频 */
  iv: IvType
  /** Video Icon */
  vdi: string
  /** 标题 */
  title: string
  /** 画质 */
  hdf: string
  /** 文件类型 */
  file_type: FileType
  /** 文件模式 */
  file_mode: string
  /** 选集码 */
  pick_code: string
  /** 是否分享 */
  is_share: string
  /** 是否置顶 */
  is_top: string
  /** 地区id */
  area_id: string
  p_id: string
  /** 目录id */
  cate_id: string
  cate_name: string
  score: string
  has_desc: string
  fl_encode: string
  fuuid: string
  shared: string
  has_pass: string
  issct: string
  /** 哈希值 */
  sha1: string
  /** 文件大小 */
  file_size?: string
  /** 播放按钮 */
  play_button: string
}

export interface ItemInfo {
  avNumber: string | null
  attributes: FileItemAttributes
  fileListType: FileListType
  duration: number
  listScrollBoxNode: Element
}

/**
 * 文件列表视图模式
 */
export enum FileListType {
  // 列表
  list = 'list',
  // 网格
  grid = 'grid',
}
