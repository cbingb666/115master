/** 查询/发起解压 */
export interface PushExtract {
  /** 文件提取码 */
  pick_code: string
  /** 压缩包密码（加密时必填） */
  secret?: string
}

/** 浏览解压文件列表 */
export interface ExtractInfo {
  /** 文件提取码 */
  pick_code: string
  /** 文件名（子目录时传入，根目录为空） */
  file_name?: string
  /** 路径（根目录为 "文件"） */
  paths?: string
  /** 分页游标 */
  next_marker?: string
  /** 每页数量 */
  page_count?: number
}

/** 保存解压文件到网盘 */
export interface AddExtractFile {
  /** 原始压缩包提取码 */
  pick_code: string
  /** 选中的文件列表 */
  extract_file?: string[]
  /** 选中的目录列表 */
  extract_dir?: string[]
  /** 目标网盘目录 cid */
  to_pid: string
  /** 当前浏览路径 */
  paths: string
}

/** 轮询文件保存进度 */
export interface AddExtractProgress {
  /** 保存任务 ID */
  extract_id: string
}

/** 获取解压后文件夹内容（下载用） */
export interface ExtractFolders {
  /** 原始压缩包提取码 */
  pick_code: string
  /** 文件夹完整路径 */
  full_dir_name: string
}

/** 验证解压文件数量 */
export interface VerifyExtractCount {
  /** 原始压缩包提取码 */
  pick_code: string
  /** 逗号分隔的目录列表 */
  full_dir_name: string
  /** 逗号分隔的文件列表 */
  full_file_name: string
}

/** 获取解压文件下载链接 */
export interface ExtractDownFile {
  /** 固定为 1 */
  dl: 1
  /** 原始压缩包提取码 */
  pick_code: string
  /** 文件在压缩包内的完整路径 */
  full_name: string
}
