import type { WebApi } from '@115master/drive115'
import type { Ref } from 'vue'
import type { Router } from 'vue-router'
import type { NavSource } from '@/hooks/useDriveNav/types'
import { computed, nextTick, watch } from 'vue'
import { useDriveCache } from '@/hooks/useDriveCache'
import { useDriveList } from '@/hooks/useDriveList'
import { useDrivePage } from '@/hooks/useDrivePage'
import { drive115 } from '@/utils/drive115Instance'

interface CacheEntry {
  data: WebApi.Res.Files
  scrollTop: number
}

export interface ExplorerOptions {
  nav: NavSource
  router?: Router
  page: Ref<number>
  size: Ref<number>
  keyword?: Ref<string>
  suffix?: Ref<string>
  type?: Ref<string>
  nf?: Ref<string>
  /** 启用滚动位置保存/恢复 */
  scroll?: boolean
  /** 获取滚动容器的 scrollTop */
  getScroll?: () => number
  /** 设置滚动位置 */
  setScroll?: (top: number) => void
}

function cacheKey(area: string, cid: string) {
  return `${area}:${cid}`
}

export function useDriveExplorer(options: ExplorerOptions) {
  const list = useDriveList()
  const page = useDrivePage({ page: options.page, size: options.size })
  const cache = useDriveCache<CacheEntry>()

  const getScroll = options.getScroll ?? (() => window.scrollY)
  const setScroll = options.setScroll ?? ((top: number) => window.scrollTo({ top, behavior: 'instant' }))

  const isSearch = computed(() => options.nav.area.value === 'search')

  const path = computed((): WebApi.Entity.PathItem[] => {
    if (isSearch.value) {
      return [
        { cid: '0', name: '全部', aid: '0', pid: '', isp: '', iss: '', fv: '', fvs: '', p_cid: '' },
        { cid: '0', name: '搜索结果', aid: '0', pid: '', isp: '', iss: '', fv: '', fvs: '', p_cid: '' },
      ]
    }
    const d = list.data.value
    if (d && 'path' in d)
      return d.path
    return []
  })

  const prevLevel = computed((): WebApi.Entity.PathItem | undefined => {
    const d = list.data.value
    if (d && 'path' in d)
      return d.path[d.path.length - 2]
    return undefined
  })

  /** 搜索请求 */
  async function fetchSearch() {
    const cid = options.nav.cid.value || '0'
    const offset = (page.page.value - 1) * page.size.value

    const params: WebApi.Req.GetFilesSearch = {
      aid: 1,
      cid,
      show_dir: 1,
      offset,
      limit: page.size.value,
      format: 'json',
      fc_mix: 0,
      search_value: options.keyword?.value ?? '',
    }
    if (page.order.value || page.asc.value) {
      params.o = page.order.value
      params.asc = page.asc.value
    }
    if (options.suffix?.value)
      params.suffix = options.suffix.value
    if (options.type?.value)
      params.type = Number(options.type.value)

    const ok = await list.search(params)
    if (ok && list.data.value)
      page.apply(list.data.value)
    return ok
  }

  /** 目录浏览请求 */
  async function fetchList() {
    const cid = options.nav.cid.value || '0'
    const area = options.nav.area.value || 'all'
    const offset = (page.page.value - 1) * page.size.value

    const params: WebApi.Req.GetFiles = {
      aid: 1,
      cid,
      show_dir: 1,
      offset,
      limit: page.size.value,
      format: 'json',
      natsort: 1,
    }
    if (page.order.value || page.asc.value || page.fc_mix.value) {
      params.o = page.order.value
      params.asc = page.asc.value
      params.fc_mix = page.fc_mix.value
    }
    if (area === 'star')
      params.star = 1
    if (options.suffix?.value)
      params.suffix = options.suffix.value
    if (options.type?.value)
      params.type = Number(options.type.value)
    if (options.nf?.value)
      params.nf = options.nf.value

    const ok = await list.execute(params)
    if (ok && list.data.value) {
      page.apply(list.data.value)
      cache.set(cacheKey(area, cid), { data: list.data.value as WebApi.Res.Files, scrollTop: 0 })
    }
    return ok
  }

  /** 构造 API 请求参数并调用 list */
  function refresh() {
    if (isSearch.value)
      return fetchSearch()
    return fetchList()
  }

  function invalidate(cid: string) {
    cache.invalidate(cacheKey('all', cid))
    cache.invalidate(cacheKey('star', cid))
  }

  /** 切换排序并保存到服务器 */
  async function changeSort(o: WebApi.Entity.Sorter['o'], a: WebApi.Entity.Sorter['asc'], f: WebApi.Entity.Sorter['fc_mix']) {
    page.changeSort(o, a, f)
    if (isSearch.value)
      return
    const cid = options.nav.cid.value || '0'
    await drive115.webApiPostFilesOrder({
      file_id: cid,
      user_order: o ?? '',
      user_asc: a ?? 1,
      fc_mix: f ?? 0,
    })
  }

  function scrollToTop() {
    if (options.scroll)
      setScroll(0)
  }

  /** 保存当前目录滚动位置到缓存 */
  function saveScroll(key: string) {
    if (!options.scroll)
      return
    const existing = cache.get(key)
    if (existing) {
      cache.set(key, { ...existing, scrollTop: getScroll() })
      return
    }
    if (list.data.value && 'path' in list.data.value)
      cache.set(key, { data: list.data.value, scrollTop: getScroll() })
  }

  /** 后退时尝试从缓存恢复 */
  function restoreCache(key: string): boolean {
    if (options.nav.direction.value !== 'back' || isSearch.value)
      return false
    const cached = cache.get(key)
    if (!cached)
      return false
    list.set(cached.data)
    page.apply(cached.data)
    if (options.scroll) {
      nextTick(() => {
        requestAnimationFrame(() => setScroll(cached.scrollTop))
      })
    }
    return true
  }

  let prevKey = cacheKey(options.nav.area.value || 'all', options.nav.cid.value || '0')
  watch(
    [options.nav.cid, options.nav.area, () => page.page.value, () => page.size.value, () => options.keyword?.value],
    (curr, prev) => {
      const [cid, area, , size, keyword] = curr
      const [prevCid, prevArea, , prevSize, prevKeyword] = prev ?? []

      // pageSize 变化: 清除缓存
      if (prevSize !== undefined && size !== prevSize) {
        cache.clear()
        scrollToTop()
        refresh()
        return
      }

      // 搜索关键词变化: 重置页码
      if (prevKeyword !== undefined && keyword !== prevKeyword) {
        page.changePage(1)
        scrollToTop()
        refresh()
        return
      }

      const cidChanged = !prev || cid !== prevCid || area !== prevArea
      const key = cacheKey(area || 'all', cid || '0')

      if (cidChanged) {
        saveScroll(prevKey)
        prevKey = key
        if (restoreCache(key))
          return
        scrollToTop()
      }

      refresh()
    },
    { immediate: true },
  )

  /** 跨路由滚动保存/恢复 (如 drive → video → drive) */
  if (options.scroll && options.router) {
    let savedScroll = 0

    options.router.beforeEach((to, from) => {
      if (from.name === 'drive' && to.name !== 'drive')
        savedScroll = getScroll()
    })

    options.router.afterEach((to, from) => {
      if (to.name === 'drive' && from.name !== 'drive' && savedScroll > 0) {
        nextTick(() => {
          requestAnimationFrame(() => {
            setScroll(savedScroll)
          })
        })
      }
    })
  }

  return {
    list,
    page,
    path,
    prevLevel,
    refresh,
    invalidate,
    changeSort,
  }
}

export type UseDriveExplorerReturn = ReturnType<typeof useDriveExplorer>
