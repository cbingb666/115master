import type { Api, Share } from '@115master/drive115'
import type { Ref } from 'vue'
import { computed, nextTick, shallowRef, watch } from 'vue'
import { queryClient } from '@/app/queryClient'
import {
  applyDriveListMutation,
  invalidateDriveListScope,
  removeDriveListScope,
} from '@/store/driveList/cache'
import { useDriveList } from '@/store/driveList/useDriveList'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'

export interface PageListOptions {
  cid: Ref<string>
  area: Ref<string>
  keyword?: Ref<string>
  fc?: Api.FileApi.Req.GetFilesSearch['fc']
  nf?: Ref<string>
  size?: number
}

/** FileBroswer 的分页视图状态；服务端状态由共享 QueryClient 持有。 */
export function useDrivePageList(options: PageListOptions) {
  const page = shallowRef(1)
  const size = shallowRef(options.size ?? 20)
  const requestedOrder = shallowRef<Share.Base.Sorter['o']>()
  const requestedAsc = shallowRef<Share.Base.Sorter['asc']>()
  const requestedFcMix = shallowRef<Share.Base.Sorter['fc_mix']>()
  const isSearch = computed(() => !!options.keyword?.value.trim())
  const list = useDriveList({
    area: options.area,
    cid: options.cid,
    page,
    size,
    mode: 'pagination',
    search: isSearch,
    keyword: () => options.keyword?.value ?? '',
    fc: options.fc ?? '',
    nf: () => options.nf?.value ?? '',
    order: requestedOrder,
    asc: requestedAsc,
    fcMix: requestedFcMix,
  })

  const data = list.data
  const loading = list.loading
  const refreshing = list.refreshing
  const error = list.error
  const total = computed(() => list.normalized.value?.total ?? 0)
  const order = computed(() => list.normalized.value?.order ?? requestedOrder.value)
  const asc = computed(() => list.normalized.value?.asc ?? requestedAsc.value)
  const fc_mix = computed(() => list.normalized.value?.fcMix ?? requestedFcMix.value)
  const pageCount = computed(() => Math.ceil(total.value / size.value))
  const path = computed(() => list.normalized.value?.path ?? [])

  function refresh() {
    return list.refresh()
  }

  function changePage(nextPage: number) {
    if (nextPage !== page.value)
      page.value = nextPage
  }

  function changeSize(nextSize: number) {
    if (nextSize === size.value)
      return
    size.value = nextSize
    page.value = 1
  }

  async function changeSort(
    nextOrder: Share.Base.Sorter['o'],
    nextAsc: Share.Base.Sorter['asc'],
    nextFcMix: Share.Base.Sorter['fc_mix'],
  ) {
    if (isSearch.value)
      return false
    const area = options.area.value || 'all'
    const cid = options.cid.value || '0'
    await drive115.file.setFilesOrder({
      file_id: cid,
      user_order: nextOrder ?? '',
      user_asc: nextAsc ?? 1,
      fc_mix: nextFcMix ?? 0,
    })
    removeDriveListScope(queryClient, area, cid)
    requestedOrder.value = nextOrder
    requestedAsc.value = nextAsc
    requestedFcMix.value = nextFcMix
    page.value = 1
    await nextTick()
    return refresh()
  }

  function applyRemove(items: Share.Entity.FilesItem[]) {
    const touched = applyDriveListMutation(
      queryClient,
      options.area.value || 'all',
      options.cid.value || '0',
      { kind: 'remove', ids: items.map(getFilesItemId) },
    )
    if (!touched)
      void refresh()
  }

  function applyUpdate(item: Share.Entity.FilesItem) {
    const touched = applyDriveListMutation(
      queryClient,
      options.area.value || 'all',
      options.cid.value || '0',
      { kind: 'update', item },
    )
    if (!touched)
      void refresh()
  }

  function applyCreate() {
    void invalidateDriveListScope(
      queryClient,
      options.area.value || 'all',
      options.cid.value || '0',
    ).then(refresh)
  }

  watch(
    [options.cid, options.area, () => options.keyword?.value],
    () => {
      page.value = 1
      requestedOrder.value = undefined
      requestedAsc.value = undefined
      requestedFcMix.value = undefined
    },
    { flush: 'sync' },
  )

  return {
    data,
    loading,
    refreshing,
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
