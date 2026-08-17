import type { Share } from '@115master/drive115'
import type { InfiniteData, QueryKey } from '@tanstack/vue-query'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ReorderOp } from './cache'
import type { DriveListPage } from './query'
import type { DriveListMode } from '@/hooks/useDriveListMode'
import { Core } from '@115master/drive115'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import { computed, nextTick, shallowRef, toValue, watch } from 'vue'
import { queryClient } from '@/app/queryClient'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'
import { appLogger } from '@/utils/logger'
import {
  applyDriveListMutation,
  invalidateDriveListScope,
  removeDriveListScope,
} from './cache'
import {
  driveListKeys,
  fetchDriveListPage,
  mergeDriveListPages,
  toListData,
} from './query'

type Input<T> = MaybeRefOrGetter<T>

interface DriveListSource {
  area: Input<string>
  cid: Input<string>
  search?: Input<boolean>
}

interface DriveListFilter {
  keyword?: Input<string>
  suffix?: Input<string>
  type?: Input<string>
  fc?: Input<string | number>
  nf?: Input<string>
}

export interface UseDriveListOptions {
  source: DriveListSource
  page: Ref<number>
  size: Ref<number>
  mode?: Input<DriveListMode>
  filter?: DriveListFilter
  onSortError?: (cause: unknown) => void
}

function read<T>(value: Input<T> | undefined, fallback: T): T {
  return value === undefined ? fallback : toValue(value)
}

export function useDriveList(options: UseDriveListOptions) {
  const requested = shallowRef<{
    order?: Share.Base.Sorter['o']
    asc?: Share.Base.Sorter['asc']
    fcMix?: Share.Base.Sorter['fc_mix']
  }>({})
  const request = computed(() => ({
    area: toValue(options.source.area) || 'all',
    cid: toValue(options.source.cid) || '0',
    page: Math.max(1, options.page.value),
    size: Math.max(1, options.size.value),
    search: read(options.source.search, false),
    keyword: read(options.filter?.keyword, '').trim(),
    suffix: read(options.filter?.suffix, ''),
    type: read(options.filter?.type, ''),
    fc: String(read(options.filter?.fc, '')),
    nf: read(options.filter?.nf, ''),
    order: requested.value.order ?? '',
    asc: requested.value.asc ?? 0,
    fcMix: requested.value.fcMix ?? 0,
  }))
  const mode = computed(() => read(options.mode, 'pagination'))

  /** Vue Query hooks 必须在 setup 时创建；mode 保证同一时刻只有一个请求启用。 */
  const pageQuery = useQuery<DriveListPage, Error, DriveListPage, QueryKey>(() => {
    const current = request.value
    return {
      queryKey: driveListKeys.page(current),
      queryFn: ({ signal }) => fetchDriveListPage(current, signal),
      enabled: mode.value === 'pagination',
      ...(current.search && { gcTime: 0 }),
    }
  }, queryClient)

  const infiniteQuery = useInfiniteQuery<
    DriveListPage,
    Error,
    InfiniteData<DriveListPage, number>,
    QueryKey,
    number
  >(() => {
    const current = request.value
    return {
      queryKey: driveListKeys.infinite(current),
      queryFn: ({ pageParam, signal }) => (
        fetchDriveListPage({ ...current, page: pageParam }, signal)
      ),
      initialPageParam: 1,
      getNextPageParam: last => (
        last.page * last.size < last.total ? last.page + 1 : undefined
      ),
      enabled: mode.value === 'infinite',
      ...(current.search && { gcTime: 0 }),
    }
  }, queryClient)

  const pageData = computed(() => pageQuery.data.value)
  const infiniteData = computed(() => mergeDriveListPages(infiniteQuery.data.value?.pages ?? []))
  const normalized = computed(() => mode.value === 'infinite' ? infiniteData.value : pageData.value)
  const data = computed(() => normalized.value ? toListData(normalized.value) : null)
  const activeError = computed(() => mode.value === 'infinite' ? infiniteQuery.error.value : pageQuery.error.value)
  const loading = computed(() => mode.value === 'infinite' ? infiniteQuery.isPending.value : pageQuery.isPending.value)
  const refreshing = computed(() => !loading.value && (
    mode.value === 'infinite'
      ? infiniteQuery.isFetching.value && !infiniteQuery.isFetchingNextPage.value
      : pageQuery.isFetching.value
  ))
  const loadingMore = computed(() => mode.value === 'infinite' && infiniteQuery.isFetchingNextPage.value)
  const error = computed(() => (
    activeError.value && !normalized.value ? Core.toDrive115Error(activeError.value) : null
  ))
  const moreError = computed(() => (
    mode.value === 'infinite' && infiniteQuery.isFetchNextPageError.value && activeError.value
      ? Core.toDrive115Error(activeError.value)
      : null
  ))
  const hasMore = computed(() => mode.value === 'infinite' && !!infiniteQuery.hasNextPage.value)
  const total = computed(() => normalized.value?.total ?? 0)
  const order = computed(() => normalized.value?.order ?? requested.value.order)
  const asc = computed(() => normalized.value?.asc ?? requested.value.asc)
  const fcMix = computed(() => normalized.value?.fcMix ?? requested.value.fcMix)
  const path = computed(() => normalized.value?.path ?? [])
  const pageCount = computed(() => Math.ceil(total.value / options.size.value))

  watch(activeError, (value) => {
    if (value)
      appLogger.warn(request.value.search ? '文件搜索失败' : '文件列表加载失败', Core.toResult(Core.toDrive115Error(value)))
  })

  async function refresh(): Promise<boolean> {
    const result = mode.value === 'infinite'
      ? await infiniteQuery.refetch()
      : await pageQuery.refetch()
    return !result.isError || result.data !== undefined
  }

  async function loadMore(): Promise<boolean> {
    if (mode.value !== 'infinite' || !infiniteQuery.hasNextPage.value || infiniteQuery.isFetchingNextPage.value)
      return false
    const result = await infiniteQuery.fetchNextPage()
    return !result.isError
  }

  function changePage(page: number) {
    if (page !== options.page.value)
      options.page.value = page
  }

  function changeSize(size: number) {
    if (size === options.size.value)
      return
    options.size.value = size
    options.page.value = 1
  }

  async function changeSort(
    order: Share.Base.Sorter['o'],
    asc: Share.Base.Sorter['asc'],
    fcMix: Share.Base.Sorter['fc_mix'],
  ) {
    if (request.value.search)
      return false
    const area = request.value.area
    const cid = request.value.cid
    try {
      await drive115.file.setFilesOrder({
        file_id: cid,
        user_order: order ?? '',
        user_asc: asc ?? 1,
        fc_mix: fcMix ?? 0,
      })
    }
    catch (cause) {
      if (!options.onSortError)
        throw cause
      options.onSortError(cause)
    }

    removeDriveListScope(queryClient, area, cid)
    requested.value = { order, asc, fcMix }
    options.page.value = 1
    await nextTick()
    return refresh()
  }

  function applyMutation(op: ReorderOp) {
    const touched = applyDriveListMutation(
      queryClient,
      request.value.area,
      request.value.cid,
      op,
    )
    if (!touched)
      void refresh()
    return touched
  }

  function applyRemove(items: Share.Entity.FilesItem[]) {
    return applyMutation({ kind: 'remove', ids: items.map(getFilesItemId) })
  }

  function applyUpdate(item: Share.Entity.FilesItem) {
    return applyMutation({ kind: 'update', item })
  }

  function invalidate(area = request.value.area, cid = request.value.cid) {
    return invalidateDriveListScope(queryClient, area, cid)
  }

  function applyCreate() {
    return invalidate().then(refresh)
  }

  watch(
    [() => request.value.area, () => request.value.cid],
    () => {
      requested.value = {}
    },
    { flush: 'sync' },
  )

  return {
    data,
    loading,
    refreshing,
    loadingMore,
    error,
    moreError,
    hasMore,
    total,
    order,
    asc,
    fcMix,
    path,
    pageCount,
    page: options.page,
    size: options.size,
    refresh,
    loadMore,
    changePage,
    changeSize,
    changeSort,
    applyMutation,
    applyRemove,
    applyUpdate,
    applyCreate,
    invalidate,
  }
}
