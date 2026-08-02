import type { Api, Share } from '@115master/drive115'
import type { Page, ReorderOp } from './cache'
import { Core } from '@115master/drive115'
import { useStorage } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { defineStore } from 'pinia'
import { computed, shallowRef, watch } from 'vue'
import { router } from '@/app/router'
import { PAGINATION_DEFAULT_PAGE_SIZE } from '@/constants'
import { usePathNav } from '@/hooks/useDriveNav'
import { useDriveSelection } from '@/hooks/useDriveSelection'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'
import { appLogger } from '@/utils/logger'
import { cacheKey, PageCache, reorder } from './cache'

/** 模块级 PageCache 单例：drive 页与 FileBroswer 共享，查询参数隔离 */
export const pageCache = new PageCache()

type ListData = Api.FileApi.Res.Files

/** 由缓存页合成 ListData（path 沿用上次的） */
function fromCache(pageData: Page, page: number, size: number, prev: ListData | null): ListData {
  return {
    state: true,
    code: 0,
    message: '',
    count: pageData.total,
    file_count: 0,
    folder_count: 0,
    is_asc: pageData.asc,
    order: pageData.order,
    fc_mix: pageData.fc_mix,
    offset: (page - 1) * size,
    cur: page,
    data: pageData.items,
    path: prev && 'path' in prev ? prev.path : [],
  } as ListData
}

export const useDriveStore = defineStore('drive', () => {
  const query = {
    keyword: useRouteQuery<string>('keyword', '', { mode: 'push' }),
    suffix: useRouteQuery('suffix', ''),
    type: useRouteQuery('type', ''),
    page: useRouteQuery<number>('page', 1, { transform: Number }),
    size: useStorage('115Master_pageSize', PAGINATION_DEFAULT_PAGE_SIZE),
  }

  const nav = usePathNav(router)
  const selection = useDriveSelection()

  const data = shallowRef<ListData | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef<Error | null>(null)

  const total = shallowRef(0)
  const order = shallowRef<Share.Base.Sorter['o']>()
  const asc = shallowRef<Share.Base.Sorter['asc']>()
  const fc_mix = shallowRef<Share.Base.Sorter['fc_mix']>()

  let generation = 0
  const isSearch = computed(() => nav.area.value === 'search')
  const pageCount = computed(() => Math.ceil(total.value / query.size.value))

  const path = computed((): Share.Entity.PathItem[] => {
    if (isSearch.value) {
      const keyword = query.keyword.value.trim()
      return [{ cid: '0', name: keyword ? `搜索: ${keyword}` : '搜索', aid: '0', pid: '', isp: '', iss: '', fv: '', fvs: '', p_cid: '' }]
    }
    if (nav.area.value === 'star')
      return [{ cid: '0', name: '星标', aid: '0', pid: '', isp: '', iss: '', fv: '', fvs: '', p_cid: '' }]
    const d = data.value
    if (d && 'path' in d)
      return d.path
    return []
  })

  const prevLevel = computed((): Share.Entity.PathItem | undefined => {
    const d = data.value
    if (d && 'path' in d)
      return d.path[d.path.length - 2]
    return undefined
  })

  function applyRes(res: ListData) {
    data.value = res
    total.value = res.count
    order.value = res.order
    asc.value = res.is_asc
    if ('fc_mix' in res)
      fc_mix.value = res.fc_mix
  }

  function listQuery(pageNum: number) {
    return {
      area: nav.area.value || 'all',
      cid: nav.cid.value || '0',
      page: pageNum,
      size: query.size.value,
      order: order.value ?? '',
      asc: asc.value ?? 0,
      fc_mix: fc_mix.value ?? 0,
      suffix: query.suffix.value,
      type: query.type.value,
      fc: '',
      nf: '',
    }
  }

  async function load(q: ReturnType<typeof listQuery>): Promise<boolean> {
    const key = cacheKey(q)
    const cached = pageCache.get(key)
    // 缓存命中 → 立即渲染，后台 SWR 校验
    if (cached)
      applyRes(fromCache(cached, q.page, q.size, data.value))

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
    if (q.area === 'star')
      params.star = 1
    if (q.suffix)
      params.suffix = q.suffix
    if (q.type)
      params.type = Number(q.type)

    try {
      const res = await pageCache.fetch(key, () => drive115.file.getFilesWithFallback(params))
      if (!res.state)
        throw new Core.Drive115Error(res.message, Core.Drive115ErrorCode.Unknown)
      if (gen !== generation)
        return false
      /** 用响应的真实排序构造写缓存 key（首次 navigate 时请求 order 为空串，响应才确定真实排序） */
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
      applyRes(res as ListData)
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
    const cid = nav.cid.value || '0'
    const params: Api.FileApi.Req.GetFilesSearch = {
      aid: 1,
      cid,
      show_dir: 1,
      offset: (query.page.value - 1) * query.size.value,
      limit: query.size.value,
      format: 'json',
      search_value: query.keyword.value,
    }
    if (query.suffix.value)
      params.suffix = query.suffix.value
    if (query.type.value)
      params.type = Number(query.type.value)

    try {
      const res = await drive115.file.searchFiles(params)
      if (!res.state)
        throw new Core.Drive115Error(res.message, Core.Drive115ErrorCode.Unknown)
      if (gen !== generation)
        return false
      data.value = res as unknown as ListData
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

  /** 导航入口：路由/翻页/排序变化时调用 */
  async function navigate(pageNum: number = query.page.value) {
    generation++
    if (isSearch.value)
      return loadSearch()
    return load(listQuery(pageNum))
  }

  function refresh() {
    return navigate(query.page.value)
  }

  function changePage(p: number) {
    if (p !== query.page.value)
      query.page.value = p
  }

  function changeSize(s: number) {
    if (s !== query.size.value) {
      query.size.value = s
      query.page.value = 1
    }
  }

  function invalidate(area: string, cid: string) {
    pageCache.invalidateCid(area, cid)
  }

  /** 对当前目录施加精确增量（删除/移出/重命名/星标状态） */
  function applyMutation(op: ReorderOp) {
    const area = nav.area.value || 'all'
    const cid = nav.cid.value || '0'
    const q = listQuery(query.page.value)
    const pages = pageCache.pagesOf(area, cid, q.size, q.order, q.asc, q.fc_mix, q.suffix, q.type, q.fc, q.nf)
    if (pages.size === 0) {
      refresh()
      return
    }
    const next = reorder(pages, q.size, op)
    for (const [p, pageData] of next)
      pageCache.set(cacheKey({ ...q, page: p }), pageData)
    /** 被清空的页槽位删除（翻到时会重新拉取，不命中空缓存渲染空页） */
    for (const p of pages.keys()) {
      if (!next.has(p)) {
        const emptyKey = cacheKey({ ...q, page: p })
        pageCache.invalidateKey(emptyKey)
      }
    }
    const current = next.get(query.page.value)
    if (current)
      applyRes(fromCache(current, query.page.value, q.size, data.value))
    else
      refresh()
    selection.clear()
  }

  /** 删除/移出：源目录全缓存页重排 + 目标目录失效 */
  function applyRemoveMutation(items: Share.Entity.FilesItem[], targetCid?: string) {
    const ids = items.map(getFilesItemId)
    applyMutation({ kind: 'remove', ids })
    if (targetCid) {
      invalidate('all', targetCid)
      invalidate('star', targetCid)
    }
    selection.clear()
  }

  /** 重命名：就地更新（位置由 SWR 修正） */
  function applyUpdateMutation(item: Share.Entity.FilesItem) {
    applyMutation({ kind: 'update', item })
    selection.clear()
  }

  /** 星标：all 区就地更新；star 区按跨目录增删（取消 → remove，新增 → 失效 star 区） */
  function applyStarMutation(items: Share.Entity.FilesItem[]) {
    const area = nav.area.value || 'all'
    if (area === 'star') {
      const hasStar = items.some(i => i.m === 1 || i.m === '1')
      if (hasStar) {
        // 取消星标 → 从 star 区列表移除
        applyMutation({ kind: 'remove', ids: items.map(getFilesItemId) })
      }
      else {
        // 新增星标 → 插入位置服务端决定 → 失效 star 区
        invalidate('star', nav.cid.value || '0')
        refresh()
      }
    }
    else {
      for (const item of items) {
        const marked = !(item.m === 1 || item.m === '1')
        applyMutation({ kind: 'update', item: { ...item, m: marked ? 1 : 0 } as Share.Entity.FilesItem })
      }
    }
    selection.clear()
  }

  async function changeSort(o: Share.Base.Sorter['o'], a: Share.Base.Sorter['asc'], f: Share.Base.Sorter['fc_mix']) {
    const cid = nav.cid.value || '0'
    // 排序持久化到服务器后旧排序缓存永不再命中，直接失效
    pageCache.invalidateCid(nav.area.value || 'all', cid)
    order.value = o
    asc.value = a
    fc_mix.value = f
    query.page.value = 1
    if (isSearch.value)
      return
    try {
      await drive115.file.setFilesOrder({
        file_id: cid,
        user_order: o ?? '',
        user_asc: a ?? 1,
        fc_mix: f ?? 0,
      })
    }
    catch (e) {
      appLogger.warn('排序保存失败', Core.toResult(Core.toDrive115Error(e)))
    }
    await navigate(1)
  }

  /** 统一 action 后处理（新增类：invalidate 当前目录 + refetch 当前页） */
  function afterAction(invalidateCids?: string[]) {
    const cid = nav.cid.value || '0'
    invalidate(nav.area.value || 'all', cid)
    invalidateCids?.forEach((c) => {
      invalidate('all', c)
      invalidate('star', c)
    })
    selection.clear()
    refresh()
  }

  /** 单一 watcher：route 参数 / 页码 / size / keyword 变化 → navigate */
  watch(
    [nav.cid, nav.area, () => query.page.value, () => query.size.value, () => query.keyword.value],
    (curr, prev) => {
      const [, , , size, keyword] = curr
      const [, , , prevSize, prevKeyword] = prev ?? []

      // pageSize 变化：旧缓存自然失配（key 含 size），滚回顶部即可
      if (prevSize !== undefined && size !== prevSize) {
        navigate()
        return
      }

      // 搜索关键词变化：重置页码
      if (prevKeyword !== undefined && keyword !== prevKeyword) {
        query.page.value = 1
        navigate()
        return
      }

      navigate()
    },
    { immediate: true },
  )

  return {
    query,
    nav,
    selection,
    // 列表状态
    data,
    loading,
    error,
    total,
    order,
    asc,
    fc_mix,
    path,
    prevLevel,
    isSearch,
    pageCount,
    // 行为
    navigate,
    refresh,
    changePage,
    changeSize,
    invalidate,
    applyMutation,
    applyRemoveMutation,
    applyUpdateMutation,
    applyStarMutation,
    changeSort,
    afterAction,
  }
})
