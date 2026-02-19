import type { Router } from 'vue-router'
import type { NavSource } from './types'
import { computed, shallowRef, watch } from 'vue'
import { useNavDirection } from './useNavDirection'

const AREAS = new Set(['star', 'recent', 'trash', 'share', 'search'])

/** 解析路由参数: 若 area 不是已知关键词则视为 cid，area 默认 'all' */
function parse(params: Record<string, string>) {
  const raw = params.area || ''
  if (AREAS.has(raw))
    return { area: raw, cid: params.cid || '0' }
  return { area: 'all', cid: raw || params.cid || '0' }
}

/** Vue Router 导航源 — drive 页面用，从 route path params 读取 cid */
export function usePathNav(r: Router): NavSource {
  const { direction } = useNavDirection(r)

  /** 仅在 drive 路由时更新 cid/area，离开 drive 时冻结最后的值 */
  const frozen = shallowRef({ cid: '0', area: 'all' })

  watch(r.currentRoute, (route) => {
    if (route.name !== 'drive')
      return
    frozen.value = parse(route.params as Record<string, string>)
  }, { immediate: true })

  const cid = computed(() => frozen.value.cid)
  const area = computed(() => frozen.value.area)

  return { cid, area, direction }
}
