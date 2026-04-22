/** RPC 预设 */
export interface Aria2RpcPreset {
  /** 稳定 ID（nanoid） */
  id: string
  /** 显示名 */
  name: string
  /** 完整 URL，支持 http://token:secret@host:port/jsonrpc#k=v&k2=v2 */
  url: string
}

/** Aria2 设置 */
export interface Aria2Settings {
  rpcList: Aria2RpcPreset[]
  downloadPath: string
  intervalMs: number
  sha1Check: boolean
  useBrowserUA: boolean
  userAgent: string
  referer: string
  /** 每行一条 "Key: Value" */
  extraHeaders: string
}

/** walker 产出的单个文件条目 */
export interface Aria2FileEntry {
  pickCode: string
  name: string
  /** 相对于起始目录的相对路径，根目录下的文件为 ''  */
  relPath: string
  /** 可选 SHA1（用于 checksum 校验） */
  sha1?: string
  /** 字节数 */
  size?: number
}

/** RPC URL 解析结果 */
export interface ParsedRpcUrl {
  /** jsonrpc HTTP endpoint */
  endpoint: string
  /** token 模式：'token:xxx'；basic 模式：'Basic <base64>'；无认证：undefined */
  auth: { mode: 'token', token: string } | { mode: 'basic', header: string } | undefined
  /** URL fragment 解析的 options，例如 {split: '10', 'max-connection-per-server': '5'} */
  options: Record<string, string>
}

export const ARIA2_DEFAULT_SETTINGS: Aria2Settings = {
  rpcList: [],
  downloadPath: '',
  intervalMs: 300,
  sha1Check: false,
  useBrowserUA: true,
  userAgent: '',
  referer: 'https://115.com',
  extraHeaders: '',
}
