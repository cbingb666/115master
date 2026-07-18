import type { Api, Share } from '@115master/drive115'
import type { Ref } from 'vue'
import { Core } from '@115master/drive115'
import { computed, shallowRef } from 'vue'
import { pageCache } from '@/store/driveList'
import { cacheKey, reorder } from '@/store/driveList/cache'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'
import { appLogger } from '@/utils/logger'

export interface PageListOptions {
  cid: Ref<string>
  area: Ref<string>
  keyword?: Ref<string>
  fc?: Api.FileApi.Req.GetFilesSearch['fc']
  nf?: Ref<string>
  size?: number
}

/**
 * FileBroswer 数据流实例：独立列表状态（数据/loading/分页），
 * 但读写模块级 PageCache 单例——drive 页的增量重排/invalidate 立即对对话框可见。
 */
export function useDrivePageList(options: PageListOptions) {
  const data = shallowRef<Api.FileApi.Res.Files | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef<Error | null>(null)
  const total = shallowRef(0)
  const page = shallowRef(1)
  const size = shallowRef(options.size ?? 20)
  const order = shallowRef<Share.Base.Sorter['o']>()
  const asc = shallowRef<Share.Base.Sorter['asc']>()
  const fc_mix = shallowRef<Share.Base.Sorter['fc_mix']>()

  let generation = 0

  const pageCount = computed(() => Math.ceil(total.value / size.value))
  /** FileBroswer 以 keyword 非空判定搜索（对话框内搜索不走 area='search'，与 drive 页 store 语义等价） */
  const isSearch = computed(() => !!options.keyword?.value.trim())

  const path = computed((): Share.Entity.PathItem[] => {
    const d = data.value
    if (d && 'path' in d)
      return d.path
    return []
  })

  function applyRes(res: Api.FileApi.Res.Files) {
    data.value = res
    total.value = res.count
    order.value = res.order
    asc.value = res.is_asc
    if ('fc_mix' in res)
      fc_mix.value = res.fc_mix
  }

  function listQuery() {
    return {
      area: options.area.value || 'all',
      cid: options.cid.value || '0',
      page: page.value,
      size: size.value,
      order: order.value ?? '',
      asc: asc.value ?? 0,
      fc_mix: fc_mix.value ?? 0,
      suffix: '',
      type: '',
      fc: options.fc ? String(options.fc) : '',
      nf: options.nf?.value ?? '',
    }
  }

  async function load(): Promise<boolean> {
    const q = listQuery()
    const key = cacheKey(q)
    const cached = pageCache.get(key)
    if (cached) {
      applyRes({
        state: true,
        code: 0,
        message: '',
        count: cached.total,
        file_count: 0,
        folder_count: 0,
        is_asc: cached.asc,
        order: cached.order,
        fc_mix: cached.fc_mix,
        offset: (q.page - 1) * q.size,
        cur: q.page,
        data: cached.items,
        path: data.value && 'path' in data.value ? data.value.path : [],
      } as Api.FileApi.Res.Files)
    }

    const gen = generation
    loading.value = true
    if (!cached)
      error.value = null

    const params: Api.FileApi.Req.GetFiles = {
      aid: 1,
      cid: q.cid,
      show_dir: 1,
      offset: (q.page - 1) * q.size,
      limit: q.size,
      format: 'json',
      natsort: 1,
    }
    if (q.order || q.asc || q.fc_mix) {
      params.o = q.order as Share.Base.Sorter['o']
      params.asc = q.asc as Share.Base.Sorter['asc']
      params.fc_mix = q.fc_mix as Share.Base.Sorter['fc_mix']
    }
    if (q.nf)
      params.nf = q.nf

    try {
      const res = await pageCache.fetch(key, () => drive115.file.getFilesWithFallback(params))
      if (!res.state)
        throw new Core.Drive115Error(res.message, Core.Drive115ErrorCode.Unknown)
      if (gen !== generation)
        return false
      /** 用响应的真实排序构造写缓存 key（首次请求 order 为空串，响应才确定真实排序） */
      const writeKey = cacheKey({
        ...q,
        order: res.order ?? '',
        asc: Number(res.is_asc ?? 0),
        fc_mix: Number('fc_mix' in res ? res.fc_mix : 0),
      })
      pageCache.set(writeKey, {
        items: res.data ?? [],
        total: res.count,
        order: res.order ?? '',
        asc: Number(res.is_asc ?? 0),
        fc_mix: Number('fc_mix' in res ? res.fc_mix : 0),
      })
      applyRes(res as Api.FileApi.Res.Files)
      error.value = null
      return true
    }
    catch (e) {
      if (gen !== generation)
        return false
      const err = Core.toDrive115Error(e)
      error.value = err
      appLogger.warn('文件列表加载失败', Core.toResult(err))
      return false
    }
    finally {
      if (gen === generation)
        loading.value = false
    }
  }

  async function loadSearch(): Promise<boolean> {
    const gen = generation
    loading.value = true
    error.value = null
    const params: Api.FileApi.Req.GetFilesSearch = {
      aid: 1,
      cid: options.cid.value || '0',
      show_dir: 1,
      offset: (page.value - 1) * size.value,
      limit: size.value,
      format: 'json',
      search_value: options.keyword?.value ?? '',
    }
    if (options.fc)
      params.fc = options.fc

    try {
      const res = await drive115.file.searchFiles(params)
      if (!res.state)
        throw new Core.Drive115Error(res.message, Core.Drive115ErrorCode.Unknown)
      if (gen !== generation)
        return false
      data.value = res as unknown as Api.FileApi.Res.Files
      total.value = res.count
      order.value = res.order
      asc.value = res.is_asc
      return true
    }
    catch (e) {
      if (gen !== generation)
        return false
      const err = Core.toDrive115Error(e)
      error.value = err
      appLogger.warn('文件搜索失败', Core.toResult(err))
      return false
    }
    finally {
      if (gen === generation)
        loading.value = false
    }
  }

  async function refresh(): Promise<boolean> {
    generation++
    if (isSearch.value)
      return loadSearch()
    return load()
  }

  function changePage(p: number) {
    if (p !== page.value) {
      page.value = p
      refresh()
    }
  }

  function changeSize(s: number) {
    if (s !== size.value) {
      size.value = s
      page.value = 1
      refresh()
    }
  }

  async function changeSort(o: Share.Base.Sorter['o'], a: Share.Base.Sorter['asc'], f: Share.Base.Sorter['fc_mix']) {
    const cid = options.cid.value || '0'
    pageCache.invalidateCid(options.area.value || 'all', cid)
    order.value = o
    asc.value = a
    fc_mix.value = f
    page.value = 1
    if (isSearch.value)
      return
    await drive115.file.setFilesOrder({
      file_id: cid,
      user_order: o ?? '',
      user_asc: a ?? 1,
      fc_mix: f ?? 0,
    })
    await refresh()
  }

  /** 对共享缓存施加精确增量，并同步当前实例状态（与 drive 页数据一致） */
  function applyMutation(op: Parameters<typeof reorder>[2]) {
    const area = options.area.value || 'all'
    const cid = options.cid.value || '0'
    const q = listQuery()
    const pages = pageCache.pagesOf(area, cid, q.size, q.order, q.asc, q.fc_mix, q.suffix, q.type, q.fc, q.nf)
    if (pages.size === 0) {
      refresh()
      return
    }
    const next = reorder(pages, q.size, op)
    for (const [p, pageData] of next)
      pageCache.set(cacheKey({ ...q, page: p }), pageData)
    for (const p of pages.keys()) {
      if (!next.has(p))
        pageCache.invalidateKey(cacheKey({ ...q, page: p }))
    }
    refresh()
  }

  /** 删除/移出：共享缓存重排 */
  function applyRemove(items: Share.Entity.FilesItem[]) {
    applyMutation({ kind: 'remove', ids: items.map(getFilesItemId) })
  }

  /** 重命名：就地更新（位置由 SWR 修正） */
  function applyUpdate(item: Share.Entity.FilesItem) {
    applyMutation({ kind: 'update', item })
  }

  /** 新增类（新建文件夹）：位置服务端决定 → 失效当前目录 + 刷新 */
  function applyCreate() {
    pageCache.invalidateCid(options.area.value || 'all', options.cid.value || '0')
    refresh()
  }

  return {
    data,
    loading,
    error,
    total,
    page,
    size,
    order,
    asc,
    fc_mix,
    pageCount,
    path,
    isSearch,
    refresh,
    changePage,
    changeSize,
    changeSort,
    applyRemove,
    applyUpdate,
    applyCreate,
  }
}

export type UseDrivePageListReturn = ReturnType<typeof useDrivePageList>
