import type { Share } from '@115master/drive115'
import type { ReorderOp } from './cache'
import { Core } from '@115master/drive115'
import { useStorage } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { defineStore } from 'pinia'
import { computed, nextTick, shallowRef, watch } from 'vue'
import { queryClient } from '@/app/queryClient'
import { router } from '@/app/router'
import { PAGINATION_DEFAULT_PAGE_SIZE } from '@/constants'
import { useDriveListMode } from '@/hooks/useDriveListMode'
import { usePathNav } from '@/hooks/useDriveNav'
import { useDriveSelection } from '@/hooks/useDriveSelection'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'
import { appLogger } from '@/utils/logger'
import {
  applyDriveListMutation,
  invalidateDriveListScope,
  removeDriveListScope,
} from './cache'
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
  const requestedOrder = shallowRef<Share.Base.Sorter['o']>()
  const requestedAsc = shallowRef<Share.Base.Sorter['asc']>()
  const requestedFcMix = shallowRef<Share.Base.Sorter['fc_mix']>()
  const isSearch = computed(() => nav.area.value === 'search')

  const list = useDriveList({
    area: () => nav.area.value,
    cid: () => nav.cid.value,
    page: () => query.page.value,
    size: () => query.size.value,
    mode,
    search: isSearch,
    keyword: () => query.keyword.value,
    suffix: () => query.suffix.value,
    type: () => query.type.value,
    order: requestedOrder,
    asc: requestedAsc,
    fcMix: requestedFcMix,
  })

  const data = list.data
  const loading = list.loading
  const refreshing = list.refreshing
  const loadingMore = list.loadingMore
  const error = list.error
  const moreError = list.moreError
  const total = computed(() => list.normalized.value?.total ?? 0)
  const order = computed(() => list.normalized.value?.order ?? requestedOrder.value)
  const asc = computed(() => list.normalized.value?.asc ?? requestedAsc.value)
  const fc_mix = computed(() => list.normalized.value?.fcMix ?? requestedFcMix.value)
  const pageCount = computed(() => Math.ceil(total.value / query.size.value))
  const hasMore = list.hasMore

  const path = computed((): Share.Entity.PathItem[] => {
    if (isSearch.value) {
      const keyword = query.keyword.value.trim()
      return [virtualPath('0', keyword ? `搜索: ${keyword}` : '搜索')]
    }
    if (nav.area.value === 'star')
      return [virtualPath('0', '星标')]
    return list.normalized.value?.path ?? []
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
    if (page !== query.page.value)
      query.page.value = page
  }

  function changeSize(size: number) {
    if (size === query.size.value)
      return
    query.size.value = size
    query.page.value = 1
  }

  function invalidate(area: string, cid: string) {
    return invalidateDriveListScope(queryClient, area, cid)
  }

  /** 对当前目录全部缓存变体施加精确增量。 */
  function applyMutation(op: ReorderOp) {
    const touched = applyDriveListMutation(
      queryClient,
      nav.area.value || 'all',
      nav.cid.value || '0',
      op,
    )
    selection.clear()
    if (!touched)
      void refresh()
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
        applyDriveListMutation(queryClient, area, nav.cid.value || '0', {
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
    if (isSearch.value)
      return false
    const area = nav.area.value || 'all'
    const cid = nav.cid.value || '0'
    try {
      await drive115.file.setFilesOrder({
        file_id: cid,
        user_order: nextOrder ?? '',
        user_asc: nextAsc ?? 1,
        fc_mix: nextFcMix ?? 0,
      })
    }
    catch (cause) {
      appLogger.warn('排序保存失败', Core.toResult(Core.toDrive115Error(cause)))
    }

    removeDriveListScope(queryClient, area, cid)
    requestedOrder.value = nextOrder
    requestedAsc.value = nextAsc
    requestedFcMix.value = nextFcMix
    query.page.value = 1
    await nextTick()
    return refresh()
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
      requestedOrder.value = undefined
      requestedAsc.value = undefined
      requestedFcMix.value = undefined
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
