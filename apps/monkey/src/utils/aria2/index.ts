import type { Aria2FileEntry, Aria2RpcPreset } from './types'
import { drive115 } from '@/utils/drive115'
import { appLogger } from '@/utils/logger'
import { readSettings } from './config'
import { buildAria2Headers } from './headers'
import { getAria2Version, parseRpcUrl, sendAddUri } from './rpc'
import { walkFolder } from './walker'

const logger = appLogger.sub('Aria2')

export { readSettings, subscribeSettings, writeSettings } from './config'
export { aria2Events } from './events'
export type { Aria2FileEntry, Aria2RpcPreset, Aria2Settings } from './types'
export { ARIA2_DEFAULT_SETTINGS } from './types'

/** 测试 RPC 连通性（返回版本号） */
export async function testRpc(rpcUrl: string): Promise<string> {
  return getAria2Version(rpcUrl)
}

/** 推送单文件 */
export async function pushFile(file: {
  pickCode: string
  name: string
  relPath?: string
  sha1?: string
}, rpc: Aria2RpcPreset): Promise<void> {
  const settings = readSettings()
  const download = await drive115.getFileDownloadUrl(file.pickCode)
  const url = download?.url?.url
  if (!url) {
    throw new Error(`无法获取下载地址: ${file.name}`)
  }
  const headers = buildAria2Headers({
    settings,
    cookie: document.cookie,
    browserUserAgent: navigator.userAgent,
  })
  const parsed = parseRpcUrl(rpc.url)
  const out = file.relPath ? `${file.relPath}/${file.name}` : file.name
  await sendAddUri(rpc.url, {
    url,
    out,
    headers,
    downloadPath: settings.downloadPath,
    sha1: file.sha1,
    sha1Check: settings.sha1Check,
    fragmentOptions: parsed.options,
  })
  logger.info('pushFile', { name: file.name, rpc: rpc.name })
}

/** 推送文件夹，支持进度回调 */
export async function pushFolder(input: {
  cid: string
  rootPath: string
  rpc: Aria2RpcPreset
  onListProgress?: (walked: number) => void
  onPushProgress?: (done: number, total: number, failed: number) => void
}): Promise<{ done: number, failed: number }> {
  const settings = readSettings()
  const files: Aria2FileEntry[] = []
  let walked = 0
  for await (const f of walkFolder(input.cid, input.rootPath, settings.intervalMs)) {
    files.push(f)
    walked++
    input.onListProgress?.(walked)
  }

  let done = 0
  let failed = 0
  for (const f of files) {
    try {
      await pushFile(
        {
          pickCode: f.pickCode,
          name: f.name,
          relPath: f.relPath,
          sha1: f.sha1,
        },
        input.rpc,
      )
      done++
    }
    catch (e) {
      failed++
      logger.warn('pushFolder: 单文件失败', { name: f.name, err: e })
    }
    input.onPushProgress?.(done, files.length, failed)
    if (settings.intervalMs > 0) {
      await new Promise(r => setTimeout(r, settings.intervalMs))
    }
  }
  return { done, failed }
}
