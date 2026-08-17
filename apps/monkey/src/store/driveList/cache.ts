import type { Share } from '@115master/drive115'
import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/vue-query'
import type { DriveListPage, DriveListProfile } from './query'
import { hashKey } from '@tanstack/vue-query'
import { getFilesItemId } from '@/utils/filesItem'

export type ReorderOp
  = | { kind: 'remove', ids: string[] }
    | { kind: 'update', item: Share.Entity.FilesItem }

interface ParsedKey {
  root: 'drive-list' | 'drive-search'
  area: string
  cid: string
  mode: 'page' | 'infinite'
  params: DriveListProfile & { page?: number }
}

interface PageEntry {
  key: QueryKey
  page: number
  data: DriveListPage
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseKey(key: QueryKey): ParsedKey | undefined {
  const [root, area, cid, mode, params] = key
  if ((root !== 'drive-list' && root !== 'drive-search')
    || typeof area !== 'string'
    || typeof cid !== 'string'
    || (mode !== 'page' && mode !== 'infinite')
    || !isRecord(params)
    || typeof params.size !== 'number') {
    return undefined
  }
  return {
    root,
    area,
    cid,
    mode,
    params: params as unknown as DriveListProfile & { page?: number },
  }
}

function isDriveListPage(value: unknown): value is DriveListPage {
  return isRecord(value)
    && Array.isArray(value.items)
    && typeof value.total === 'number'
    && typeof value.page === 'number'
    && typeof value.size === 'number'
}

function isInfiniteDriveListData(value: unknown): value is InfiniteData<DriveListPage, number> {
  return isRecord(value)
    && Array.isArray(value.pages)
    && value.pages.every(isDriveListPage)
    && Array.isArray(value.pageParams)
}

function matchesScope(key: QueryKey, area: string, cid: string) {
  const parsed = parseKey(key)
  return parsed?.area === area && parsed.cid === cid
}

function removalMeta(pages: Map<number, DriveListPage>, ids: Set<string>) {
  const found = new Map<string, Share.Entity.FilesItem>()
  pages.forEach(page => page.items.forEach((item) => {
    const id = getFilesItemId(item)
    if (ids.has(id))
      found.set(id, item)
  }))
  const first = [...pages.values()][0]
  const values = [...found.values()]
  return {
    total: Math.max(0, (first?.total ?? 0) - found.size),
    fileCount: Math.max(0, (first?.fileCount ?? 0) - values.filter(item => item.fc !== 0).length),
    folderCount: Math.max(0, (first?.folderCount ?? 0) - values.filter(item => item.fc === 0).length),
  }
}

/**
 * 对同一查询组合的全部缓存页做纯数据投影。
 * remove 会跨页补位；update 仅替换实体，排序位置交给下次后台校验纠正。
 */
export function reorder(
  pages: Map<number, DriveListPage>,
  size: number,
  op: ReorderOp,
): Map<number, DriveListPage> {
  const sorted = [...pages.entries()].sort((a, b) => a[0] - b[0])
  if (sorted.length === 0)
    return new Map()

  if (op.kind === 'update') {
    const id = getFilesItemId(op.item)
    return new Map(sorted.map(([pageNumber, page]) => [
      pageNumber,
      {
        ...page,
        items: page.items.map(item => getFilesItemId(item) === id ? op.item : item),
      },
    ]))
  }

  const ids = new Set(op.ids)
  const meta = removalMeta(pages, ids)
  const result = new Map<number, DriveListPage>()
  let start = 0
  for (let index = 1; index <= sorted.length; index++) {
    const previousPage = sorted[index - 1]?.[0]
    const currentPage = sorted[index]?.[0]
    if (index < sorted.length && currentPage === previousPage + 1)
      continue

    const run = sorted.slice(start, index)
    const items = run
      .flatMap(([, page]) => page.items)
      .filter(item => !ids.has(getFilesItemId(item)))
    run.forEach(([pageNumber, page], runIndex) => {
      const pageItems = items.slice(runIndex * size, (runIndex + 1) * size)
      if (pageItems.length > 0)
        result.set(pageNumber, { ...page, ...meta, items: pageItems })
    })
    start = index
  }
  return result
}

function updatePaginationGroups(client: QueryClient, area: string, cid: string, op: ReorderOp) {
  const groups = new Map<string, PageEntry[]>()
  const queries = client.getQueryCache().findAll({
    predicate: query => matchesScope(query.queryKey, area, cid),
  })

  queries.forEach((query) => {
    const parsed = parseKey(query.queryKey)
    if (!parsed || parsed.mode !== 'page' || typeof parsed.params.page !== 'number' || !isDriveListPage(query.state.data))
      return
    const { page, ...profile } = parsed.params
    const groupKey = hashKey([parsed.root, parsed.area, parsed.cid, profile])
    const entries = groups.get(groupKey) ?? []
    entries.push({ key: query.queryKey, page, data: query.state.data })
    groups.set(groupKey, entries)
  })

  let touched = false
  groups.forEach((entries) => {
    const pages = new Map(entries.map(entry => [entry.page, entry.data]))
    const next = reorder(pages, entries[0].data.size, op)
    const first = entries[0].data
    const meta = op.kind === 'remove'
      ? removalMeta(pages, new Set(op.ids))
      : { total: first.total, fileCount: first.fileCount, folderCount: first.folderCount }

    entries.forEach((entry) => {
      client.setQueryData(
        entry.key,
        next.get(entry.page) ?? { ...entry.data, ...meta, items: [] },
      )
    })
    touched = true
  })
  return touched
}

function updateInfiniteQueries(client: QueryClient, area: string, cid: string, op: ReorderOp) {
  const queries = client.getQueryCache().findAll({
    predicate: query => matchesScope(query.queryKey, area, cid),
  })
  let touched = false

  queries.forEach((query) => {
    const parsed = parseKey(query.queryKey)
    const current = query.state.data
    if (!parsed || parsed.mode !== 'infinite' || !isInfiniteDriveListData(current))
      return
    const pages = new Map(current.pages.map(page => [page.page, page]))
    const next = [...reorder(pages, parsed.params.size, op).values()]
    const first = current.pages[0]
    const meta = op.kind === 'remove'
      ? removalMeta(pages, new Set(op.ids))
      : first && { total: first.total, fileCount: first.fileCount, folderCount: first.folderCount }
    const resultPages = next.length > 0 || !first
      ? next
      : [{ ...first, ...meta, items: [] }]
    client.setQueryData<InfiniteData<DriveListPage, number>>(query.queryKey, {
      pages: resultPages,
      pageParams: resultPages.map(page => page.page),
    })
    touched = true
  })
  return touched
}

/** 对目录内所有已缓存分页、无限列表和搜索变体同步施加增量。 */
export function applyDriveListMutation(
  client: QueryClient,
  area: string,
  cid: string,
  op: ReorderOp,
) {
  void client.cancelQueries({ predicate: query => matchesScope(query.queryKey, area, cid) })
  const pageTouched = updatePaginationGroups(client, area, cid, op)
  const infiniteTouched = updateInfiniteQueries(client, area, cid, op)
  return pageTouched || infiniteTouched
}

/** 标记目录下所有查询变体过期；不主动刷新非当前目录。 */
export async function invalidateDriveListScope(client: QueryClient, area: string, cid: string) {
  const predicate = (query: { queryKey: QueryKey }) => matchesScope(query.queryKey, area, cid)
  await client.cancelQueries({ predicate })
  await client.invalidateQueries({ predicate, refetchType: 'none' })
}

/** 排序规则改变后丢弃该目录旧规则数据。 */
export function removeDriveListScope(client: QueryClient, area: string, cid: string) {
  const predicate = (query: { queryKey: QueryKey }) => matchesScope(query.queryKey, area, cid)
  void client.cancelQueries({ predicate })
  client.removeQueries({ predicate })
}
