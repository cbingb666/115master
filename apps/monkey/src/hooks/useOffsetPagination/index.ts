import type { UseOffsetPaginationOptions as UseOffsetPaginationOptionsCore, UseOffsetPaginationReturn as UseOffsetPaginationReturnCore } from '@vueuse/core'
import type { Ref } from 'vue'
import {
  useOffsetPagination as useOffsetPaginationCore,
} from '@vueuse/core'
import { shallowRef } from 'vue'

export interface UseOffsetPaginationReturnExtend {
  changeCurrentPage: (page: number) => void
  changePageSize: (size: number) => void
  total: Ref<number>
}

export interface UseOffsetPaginationOptions extends UseOffsetPaginationOptionsCore {
  router?: boolean
}

export interface UseOffsetPaginationReturn extends UseOffsetPaginationReturnCore, UseOffsetPaginationReturnExtend {}

/**
 * 使用 useOffsetPagination 管理分页状态
 */
export function useOffsetPagination(options: UseOffsetPaginationOptions): UseOffsetPaginationReturn {
  const optionsCore: UseOffsetPaginationOptionsCore = {
    ...options,
  }

  const total = shallowRef(Infinity)

  const pagination = useOffsetPaginationCore({
    total,
    ...optionsCore,
  }) as UseOffsetPaginationReturn

  function changeCurrentPage(page: number) {
    pagination.currentPage.value = page
  }

  function changePageSize(size: number) {
    pagination.currentPageSize.value = size
  }

  return {
    ...pagination,
    total,
    changeCurrentPage,
    changePageSize,
  }
}
