import { useStorage } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { defineStore } from 'pinia'
import { router } from '@/app/router'
import { PAGINATION_DEFAULT_PAGE_SIZE } from '@/constants'
import { useDriveExplorer } from '@/hooks/useDriveExplorer'
import { usePathNav } from '@/hooks/useDriveNav'
import { useDriveSelection } from '@/hooks/useDriveSelection'

export const useDriveStore = defineStore('drive', () => {
  const query = {
    keyword: useRouteQuery<string>('keyword', '', { mode: 'push' }),
    suffix: useRouteQuery('suffix', ''),
    type: useRouteQuery('type', ''),
    page: useRouteQuery<number>('page', 1, { transform: Number }),
    size: useStorage('115Master_pageSize', PAGINATION_DEFAULT_PAGE_SIZE),
  }

  const nav = usePathNav(router)

  const explorer = useDriveExplorer({
    nav,
    router,
    page: query.page,
    size: query.size,
    keyword: query.keyword,
    suffix: query.suffix,
    type: query.type,
    scroll: true,
  })

  const selection = useDriveSelection()

  /** 统一 action 后处理 */
  function afterAction(invalidateCids?: string[]) {
    explorer.refresh()
    selection.clear()
    invalidateCids?.forEach(cid => explorer.invalidate(cid))
  }

  return {
    query,
    nav,
    explorer,
    selection,
    afterAction,
    // 便捷透传
    list: explorer.list,
    page: explorer.page,
    path: explorer.path,
    prevLevel: explorer.prevLevel,
    refresh: explorer.refresh,
    invalidate: explorer.invalidate,
    changeSort: explorer.changeSort,
  }
})
