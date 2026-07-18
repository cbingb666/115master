import type { Share } from '@115master/drive115'
import { getFilesItemId } from '@/utils/filesItem'

/** 列表查询参数（全部参与缓存键，保证不同查询组合互不覆盖） */
export interface ListQuery {
  /** 区域 'all' | 'star' | ... */
  area: string
  cid: string
  page: number
  size: number
  order: string
  asc: number
  /** 文件夹混排（排序参数之一），必须进 key */
  fc_mix: number
  /** 文件后缀筛选 */
  suffix: string
  /** 文件类型筛选 */
  type: string
  /** 只显示文件或文件夹（FileBroswer 用 fc=1） */
  fc: string
  /** 不显示文件夹（FileBroswer 用 nf='1'） */
  nf: string
}

export function cacheKey(q: ListQuery): string {
  return [
    q.area,
    q.cid,
    q.page,
    q.size,
    q.order,
    q.asc,
    q.fc_mix,
    q.suffix,
    q.type,
    q.fc,
    q.nf,
  ].join('|')
}

/** 目录前缀（用于按目录失效该目录全部页/排序/size 组合） */
export function cidPrefix(area: string, cid: string): string {
  return `${area}|${cid}|`
}

export interface Page {
  items: Share.Entity.FilesItem[]
  total: number
  order: string
  asc: number
  fc_mix: number
}

export class PageCache {
  private store = new Map<string, Page>()
  private inflight = new Map<string, Promise<unknown>>()

  constructor(private max = 150) {}

  get size() {
    return this.store.size
  }

  get(key: string): Page | undefined {
    const entry = this.store.get(key)
    if (!entry)
      return undefined
    // LRU: 移到末尾
    this.store.delete(key)
    this.store.set(key, entry)
    return entry
  }

  set(key: string, page: Page) {
    this.store.delete(key)
    this.store.set(key, page)
    if (this.store.size > this.max) {
      const oldest = this.store.keys().next().value!
      this.store.delete(oldest)
    }
  }

  /** 前缀失效：删除该目录全部页（所有排序/size/筛选组合） */
  invalidateCid(area: string, cid: string) {
    const prefix = cidPrefix(area, cid)
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix))
        this.store.delete(key)
    }
  }

  /** 按完整 key 删除单个槽位 */
  invalidateKey(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }

  /** 收集某目录某排序组合下全部已缓存页（page 升序），供 reorder 使用 */
  pagesOf(area: string, cid: string, size: number, order: string, asc: number, fcMix: number, suffix: string, type: string, fc: string, nf: string): Map<number, Page> {
    const pages = new Map<number, Page>()
    const prefix = cidPrefix(area, cid)
    for (const [key, page] of this.store) {
      if (!key.startsWith(prefix))
        continue
      const parts = key.split('|')
      if (Number(parts[3]) !== size)
        continue
      if (parts[4] !== order || parts[5] !== String(asc) || parts[6] !== String(fcMix))
        continue
      if (parts[7] !== suffix || parts[8] !== type || parts[9] !== fc || parts[10] !== nf)
        continue
      pages.set(Number(parts[2]), page)
    }
    return pages
  }

  /** 请求去重：同 key 有 in-flight 时复用 Promise */
  fetch<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const pending = this.inflight.get(key)
    if (pending)
      return pending as Promise<T>
    const promise = loader().finally(() => this.inflight.delete(key))
    this.inflight.set(key, promise)
    return promise
  }
}

export type ReorderOp
  = | { kind: 'remove', ids: string[] }
    | { kind: 'update', item: Share.Entity.FilesItem }

/**
 * 全缓存页重排。
 * remove: 拍平已缓存页 → 按 id 移除 → 按 size 重新切页；最后一页存在未缓存后续页时允许不满。
 * update: 只就地替换同 id 数据，不触碰排序位置（位置由 SWR 后台校验修正）。
 * 未缓存的页不在输出中（翻到时会重新拉取）。
 */
export function reorder(pages: Map<number, Page>, size: number, op: ReorderOp): Map<number, Page> {
  const sorted = [...pages.entries()].sort((a, b) => a[0] - b[0])
  if (sorted.length === 0)
    return new Map()

  if (op.kind === 'update') {
    const id = getFilesItemId(op.item)
    return new Map(sorted.map(([p, page]) => [
      p,
      {
        ...page,
        items: page.items.map(item => getFilesItemId(item) === id ? op.item : item),
      },
    ]))
  }

  const ids = new Set(op.ids)
  const meta = sorted[0][1]
  const flat = sorted.flatMap(([, page]) => page.items)
  const kept = flat.filter(item => !ids.has(getFilesItemId(item)))
  const removed = flat.length - kept.length
  const total = Math.max(0, meta.total - removed)

  const result = new Map<number, Page>()
  sorted.forEach(([p], i) => {
    const items = kept.slice(i * size, (i + 1) * size)
    // 全部移除 → 清空所有槽位（total=0）；部分移除 → 仅清理变空的槽位
    if (items.length === 0)
      return
    result.set(p, { ...meta, items, total })
  })
  return result
}
