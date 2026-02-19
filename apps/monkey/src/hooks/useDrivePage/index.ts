import type { WebApi } from '@115master/drive115'
import type { Ref } from 'vue'
import type { ListData } from '@/hooks/useDriveList'
import { computed, shallowRef } from 'vue'

export function useDrivePage(options: { page: Ref<number>, size: Ref<number> }) {
  const total = shallowRef(0)
  const pageCount = computed(() => Math.ceil(total.value / options.size.value))
  const order = shallowRef<WebApi.Entity.Sorter['o']>()
  const asc = shallowRef<WebApi.Entity.Sorter['asc']>()
  const fc_mix = shallowRef<WebApi.Entity.Sorter['fc_mix']>()

  function changePage(p: number) {
    if (p !== options.page.value)
      options.page.value = p
  }

  function changeSize(s: number) {
    if (s !== options.size.value) {
      options.size.value = s
      options.page.value = 1
    }
  }

  function changeSort(o: WebApi.Entity.Sorter['o'], a: WebApi.Entity.Sorter['asc'], f: WebApi.Entity.Sorter['fc_mix']) {
    if (o !== order.value || a !== asc.value || f !== fc_mix.value) {
      order.value = o
      asc.value = a
      fc_mix.value = f
    }
  }

  /** 从响应同步分页/排序信息 */
  function apply(res: ListData) {
    total.value = res.count
    order.value = res.order
    asc.value = res.is_asc
    if ('fc_mix' in res)
      fc_mix.value = res.fc_mix
  }

  return {
    page: options.page,
    size: options.size,
    total,
    pageCount,
    order,
    asc,
    fc_mix,
    changePage,
    changeSize,
    changeSort,
    apply,
  }
}

export type UseDrivePageReturn = ReturnType<typeof useDrivePage>
