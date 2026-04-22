import type { Aria2FileEntry } from './types'
import { drive115 } from '@/utils/drive115'

interface RawItem {
  pc?: string
  cid?: string
  n: string
  sha?: string
  s?: number
}

async function fetchPage(cid: string, intervalMs: number): Promise<RawItem[]> {
  if (!cid) {
    throw new Error('walkFolder: cid 为空，无法获取目录')
  }
  /** 字段对齐 drive115 wrap.ts 中 getPlaylist 的参数，只改 show_dir 为 1 以拿到子目录 */
  const params = {
    aid: 1,
    cid,
    offset: 0,
    limit: 1150,
    show_dir: 1,
    nf: '',
    qid: 0,
    type: 0,
    source: '',
    format: 'json',
    star: '',
    is_q: '',
    is_share: '',
    r_all: 1,
    o: 'file_name',
    asc: 1,
    cur: 1,
    natsort: 1,
  }

  // 带一次重试
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await drive115.getFiles(params as any)

      return (((resp as any).data ?? []) as RawItem[])
    }
    catch (e) {
      if (attempt === 1)
        throw e
      if (intervalMs > 0)
        await new Promise(r => setTimeout(r, intervalMs))
    }
  }
  return []
}

/**
 * 递归遍历目录，逐个 yield 文件条目（深度优先 + 节流）
 * @param cid 起始目录 cid
 * @param rootPath 起始目录显示名，用作 relPath 前缀
 * @param intervalMs 页之间的节流间隔
 */
export async function* walkFolder(
  cid: string,
  rootPath: string,
  intervalMs: number,
): AsyncGenerator<Aria2FileEntry> {
  const stack: Array<{ cid: string, relPath: string }> = [
    { cid, relPath: rootPath },
  ]

  while (stack.length > 0) {
    const cur = stack.pop()!
    const items = await fetchPage(cur.cid, intervalMs)

    for (const item of items) {
      if (item.sha) {
        yield {
          pickCode: String(item.pc),
          name: item.n,
          relPath: cur.relPath,
          sha1: item.sha,
          size: item.s,
        }
      }
      else if (item.cid) {
        stack.push({
          cid: item.cid,
          relPath: cur.relPath ? `${cur.relPath}/${item.n}` : item.n,
        })
      }
    }

    if (stack.length > 0 && intervalMs > 0) {
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }
}
