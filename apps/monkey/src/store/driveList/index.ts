import type { Share } from '@115master/drive115'
import { Core } from '@115master/drive115'
import { useStorage } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { router } from '@/app/router'
import { PAGINATION_DEFAULT_PAGE_SIZE } from '@/constants'
import { useDriveList } from '@/hooks/useDriveList'
import { useDriveListMode } from '@/hooks/useDriveListMode'
import { usePathNav } from '@/hooks/useDriveNav'
import { useDriveSelection } from '@/hooks/useDriveSelection'
import { appLogger } from '@/utils/logger'

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

  const items = list.items
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

  const refresh = list.refresh
  const loadMore = list.loadMore
  const changePage = list.changePage
  const changeSize = list.changeSize
  const changeSort = list.changeSort

  function afterAction() {
    selection.clear()
    return refresh()
  }

  watch(
    [() => query.keyword.value, () => query.size.value, () => mode.value],
    () => {
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
    items,
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
    refresh,
    loadMore,
    changePage,
    changeSize,
    changeSort,
    afterAction,
  }
})
