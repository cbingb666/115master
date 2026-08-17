import type { Share } from '@115master/drive115'
import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import type { DriveListPage } from './query'
import { Core } from '@115master/drive115'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import { computed, toValue, watch } from 'vue'
import { queryClient as appQueryClient } from '@/app/queryClient'
import { appLogger } from '@/utils/logger'
import {
  driveListKeys,
  fetchDriveListPage,
  mergeDriveListPages,
  toListData,
} from './query'

type Input<T> = MaybeRefOrGetter<T>

export interface UseDriveListOptions {
  area: Input<string>
  cid: Input<string>
  page: Input<number>
  size: Input<number>
  mode: Input<'pagination' | 'infinite'>
  search: Input<boolean>
  enabled?: Input<boolean>
  keyword?: Input<string>
  suffix?: Input<string>
  type?: Input<string>
  fc?: Input<string | number>
  nf?: Input<string>
  order?: Input<Share.Base.Sorter['o'] | '' | undefined>
  asc?: Input<Share.Base.Sorter['asc'] | undefined>
  fcMix?: Input<Share.Base.Sorter['fc_mix'] | undefined>
  queryClient?: QueryClient
}

function read<T>(value: Input<T> | undefined, fallback: T): T {
  return value === undefined ? fallback : toValue(value)
}

export function useDriveList(options: UseDriveListOptions) {
  const client = options.queryClient ?? appQueryClient
  const request = computed(() => ({
    area: toValue(options.area) || 'all',
    cid: toValue(options.cid) || '0',
    page: Math.max(1, toValue(options.page)),
    size: Math.max(1, toValue(options.size)),
    search: toValue(options.search),
    keyword: read(options.keyword, '').trim(),
    suffix: read(options.suffix, ''),
    type: read(options.type, ''),
    fc: String(read(options.fc, '')),
    nf: read(options.nf, ''),
    order: read(options.order, '') ?? '',
    asc: read(options.asc, 0) ?? 0,
    fcMix: read(options.fcMix, 0) ?? 0,
  }))
  const mode = computed(() => toValue(options.mode))
  const enabled = computed(() => read(options.enabled, true))

  const pageQuery = useQuery<DriveListPage, Error, DriveListPage, QueryKey>(() => {
    const current = request.value
    return {
      queryKey: driveListKeys.page(current),
      queryFn: ({ signal }) => fetchDriveListPage(current, signal),
      enabled: enabled.value && mode.value === 'pagination',
      ...(current.search && { gcTime: 0 }),
    }
  }, client)

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
      enabled: enabled.value && mode.value === 'infinite',
      ...(current.search && { gcTime: 0 }),
    }
  }, client)

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

  return {
    request,
    normalized,
    data,
    loading,
    refreshing,
    loadingMore,
    error,
    moreError,
    hasMore,
    refresh,
    loadMore,
  }
}
