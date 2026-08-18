import type { Share } from '@115master/drive115'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { DriveListPage } from './query'
import type { DriveListMode } from '@/hooks/useDriveListMode'
import { Core } from '@115master/drive115'
import { computed, nextTick, onScopeDispose, shallowRef, toValue, watch } from 'vue'
import { drive115 } from '@/utils/drive115Instance'
import { appLogger } from '@/utils/logger'
import {
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

  const page = shallowRef<DriveListPage>()
  const pages = shallowRef<DriveListPage[]>([])
  const fault = shallowRef<Core.Drive115Error>()
  const moreFault = shallowRef<Core.Drive115Error>()
  const loading = shallowRef(false)
  const refreshing = shallowRef(false)
  const loadingMore = shallowRef(false)
  let controller: AbortController | undefined
  let moreController: AbortController | undefined
  let generation = 0
  let task: Promise<boolean> = Promise.resolve(false)

  const pageData = computed(() => page.value)
  const infiniteData = computed(() => mergeDriveListPages(pages.value))
  const normalized = computed(() => mode.value === 'infinite' ? infiniteData.value : pageData.value)
  const data = computed(() => normalized.value ? toListData(normalized.value) : null)
  const error = computed(() => fault.value && !normalized.value ? fault.value : null)
  const moreError = computed(() => mode.value === 'infinite' ? moreFault.value ?? null : null)
  const hasMore = computed(() => {
    if (mode.value !== 'infinite')
      return false
    const last = pages.value[pages.value.length - 1]
    return !!last && last.page * last.size < last.total
  })
  const total = computed(() => normalized.value?.total ?? 0)
  const order = computed(() => normalized.value?.order ?? requested.value.order)
  const asc = computed(() => normalized.value?.asc ?? requested.value.asc)
  const fcMix = computed(() => normalized.value?.fcMix ?? requested.value.fcMix)
  const path = computed(() => normalized.value?.path ?? [])
  const pageCount = computed(() => Math.ceil(total.value / options.size.value))

  async function fetchPage(input: typeof request.value, signal: AbortSignal) {
    try {
      return await fetchDriveListPage(input, signal)
    }
    catch (cause) {
      if (signal.aborted || !Core.toDrive115Error(cause).retryable)
        throw cause
      return fetchDriveListPage(input, signal)
    }
  }

  async function load(reset: boolean) {
    const current = request.value
    const currentMode = mode.value
    const token = ++generation
    controller?.abort()
    moreController?.abort()
    loadingMore.value = false
    const active = new AbortController()
    controller = active
    fault.value = undefined
    moreFault.value = undefined

    if (reset) {
      page.value = undefined
      pages.value = []
    }
    loading.value = normalized.value === undefined
    refreshing.value = !loading.value

    try {
      const numbers = currentMode === 'infinite'
        ? reset || pages.value.length === 0 ? [1] : pages.value.map(value => value.page)
        : [current.page]
      const result = await Promise.all(numbers.map(number => fetchPage({ ...current, page: number }, active.signal)))
      if (token !== generation || active.signal.aborted)
        return false
      if (currentMode === 'infinite')
        pages.value = result
      else
        page.value = result[0]
      return true
    }
    catch (cause) {
      if (token !== generation || active.signal.aborted)
        return false
      fault.value = Core.toDrive115Error(cause)
      appLogger.warn(current.search ? '文件搜索失败' : '文件列表加载失败', Core.toResult(fault.value))
      return false
    }
    finally {
      if (token === generation) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  function refresh() {
    task = load(false)
    return task
  }

  async function loadMore(): Promise<boolean> {
    const last = pages.value[pages.value.length - 1]
    if (mode.value !== 'infinite' || !last || !hasMore.value || loading.value || refreshing.value || loadingMore.value)
      return false
    const token = generation
    moreController?.abort()
    const active = new AbortController()
    moreController = active
    loadingMore.value = true
    moreFault.value = undefined
    try {
      const result = await fetchPage({ ...request.value, page: last.page + 1 }, active.signal)
      if (token !== generation || active.signal.aborted)
        return false
      pages.value = [...pages.value, result]
      return true
    }
    catch (cause) {
      if (token !== generation || active.signal.aborted)
        return false
      moreFault.value = Core.toDrive115Error(cause)
      appLogger.warn(request.value.search ? '文件搜索失败' : '文件列表加载失败', Core.toResult(moreFault.value))
      return false
    }
    finally {
      if (token === generation)
        loadingMore.value = false
    }
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

    requested.value = { order, asc, fcMix }
    options.page.value = 1
    await nextTick()
    return task
  }

  watch(
    [() => request.value.area, () => request.value.cid],
    () => {
      requested.value = {}
    },
    { flush: 'sync' },
  )
  watch([request, mode], () => {
    task = load(true)
  }, { immediate: true })
  onScopeDispose(() => {
    generation++
    controller?.abort()
    moreController?.abort()
  })

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
  }
}
