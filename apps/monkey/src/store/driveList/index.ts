import type { Share } from '@115master/drive115'
import type { ReorderOp } from './cache'
import { Core } from '@115master/drive115'
import { useStorage } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { defineStore } from 'pinia'
import { computed, nextTick, watch } from 'vue'
import { router } from '@/app/router'
import { PAGINATION_DEFAULT_PAGE_SIZE } from '@/constants'
import { useDriveListMode } from '@/hooks/useDriveListMode'
import { usePathNav } from '@/hooks/useDriveNav'
import { useDriveSelection } from '@/hooks/useDriveSelection'
import { getFilesItemId } from '@/utils/filesItem'
import { appLogger } from '@/utils/logger'
import { useDriveList } from './useDriveList'

function virtualPath(cid: string, name: string): Share.Entity.PathItem {
  return { cid, name, aid: '0', pid: '', isp: '', iss: '', fv: '', fvs: '', p_cid: '' }
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
  const mode = useDriveListMode()
  const isSearch = computed(() => nav.area.value === 'search')

  const list = useDriveList({
    source: {
      area: nav.area,
      cid: nav.cid,
      search: isSearch,
    },
    page: query.page,
    size: query.size,
    mode,
    filter: {
      keyword: query.keyword,
      suffix: query.suffix,
      type: query.type,
    },
    onSortError: cause => appLogger.warn(
      '排序保存失败',
      Core.toResult(Core.toDrive115Error(cause)),
    ),
  })

  const data = list.data
  const loading = list.loading
  const refreshing = list.refreshing
  const loadingMore = list.loadingMore
  const error = list.error
  const moreError = list.moreError
  const total = list.total
  const order = list.order
  const asc = list.asc
  const fc_mix = list.fcMix
  const pageCount = list.pageCount
  const hasMore = list.hasMore

  const path = computed((): Share.Entity.PathItem[] => {
    if (isSearch.value) {
      const keyword = query.keyword.value.trim()
      return [virtualPath('0', keyword ? `搜索: ${keyword}` : '搜索')]
    }
    if (nav.area.value === 'star')
      return [virtualPath('0', '星标')]
    return list.path.value
  })
  const prevLevel = computed(() => path.value[path.value.length - 2])

  async function navigate(pageNum: number = query.page.value) {
    if (mode.value === 'pagination' && pageNum !== query.page.value) {
      query.page.value = pageNum
      await nextTick()
    }
    return list.refresh()
  }

  function refresh() {
    return list.refresh()
  }

  function loadMore() {
    return list.loadMore()
  }

  function changePage(page: number) {
    list.changePage(page)
  }

  function changeSize(size: number) {
    list.changeSize(size)
  }

  function invalidate(area: string, cid: string) {
    return list.invalidate(area, cid)
  }

  /** 对当前目录全部缓存变体施加精确增量。 */
  function applyMutation(op: ReorderOp) {
    list.applyMutation(op)
    selection.clear()
  }

  function applyRemoveMutation(items: Share.Entity.FilesItem[], targetCid?: string) {
    applyMutation({ kind: 'remove', ids: items.map(getFilesItemId) })
    if (targetCid) {
      void invalidate('all', targetCid)
      void invalidate('star', targetCid)
    }
  }

  function applyUpdateMutation(item: Share.Entity.FilesItem) {
    applyMutation({ kind: 'update', item })
  }

  function applyStarMutation(items: Share.Entity.FilesItem[]) {
    const area = nav.area.value || 'all'
    if (area === 'star') {
      const hasStar = items.some(item => item.m === 1 || item.m === '1')
      if (hasStar) {
        applyMutation({ kind: 'remove', ids: items.map(getFilesItemId) })
      }
      else {
        void invalidate('star', nav.cid.value || '0')
        void refresh()
      }
    }
    else {
      items.forEach((item) => {
        const marked = !(item.m === 1 || item.m === '1')
        list.applyMutation({
          kind: 'update',
          item: { ...item, m: marked ? 1 : 0 } as Share.Entity.FilesItem,
        })
      })
    }
    selection.clear()
  }

  async function changeSort(
    nextOrder: Share.Base.Sorter['o'],
    nextAsc: Share.Base.Sorter['asc'],
    nextFcMix: Share.Base.Sorter['fc_mix'],
  ) {
    return list.changeSort(nextOrder, nextAsc, nextFcMix)
  }

  function afterAction(invalidateCids?: string[]) {
    const cid = nav.cid.value || '0'
    void invalidate(nav.area.value || 'all', cid)
    invalidateCids?.forEach((targetCid) => {
      void invalidate('all', targetCid)
      void invalidate('star', targetCid)
    })
    selection.clear()
    void refresh()
  }

  watch(
    [() => query.keyword.value, () => query.size.value, () => mode.value],
    (_current, previous) => {
      if (previous)
        query.page.value = 1
      selection.clear()
    },
    { flush: 'sync' },
  )
  watch(
    [nav.cid, nav.area],
    () => {
      selection.clear()
    },
    { flush: 'sync' },
  )

  return {
    query,
    nav,
    selection,
    data,
    loading,
    refreshing,
    loadingMore,
    error,
    moreError,
    total,
    order,
    asc,
    fc_mix,
    path,
    prevLevel,
    isSearch,
    pageCount,
    hasMore,
    mode,
    navigate,
    refresh,
    loadMore,
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
