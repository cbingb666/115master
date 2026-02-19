import type { ComputedRef, Ref } from 'vue'
import type { Router } from 'vue-router'
import type { NavSource } from './types'
import { computed } from 'vue'
import { useNavDirection } from './useNavDirection'

export interface QueryNavReturn extends NavSource {
  push: (cid: string) => void
  canBack: ComputedRef<boolean>
  canForward: ComputedRef<boolean>
  dispose: () => void
}

export interface QueryNavOptions {
  defaultCid: string
  onExit?: () => void
}

/** Query 参数导航源 — FileBrowser 对话框用，从 route query params (`?fb_cid=xxx`) 读取 cid */
export function useQueryNav(r: Router, options: QueryNavOptions): QueryNavReturn {
  const { direction, position, remove: removeDirection } = useNavDirection(r)
  const initial = position()

  /** 推入初始条目，使对话框拥有独立的历史记录层 */
  r.push({ query: { ...r.currentRoute.value.query, fb_cid: options.defaultCid } })

  const cid = computed(() => {
    const q = r.currentRoute.value.query.fb_cid
    return (typeof q === 'string' ? q : undefined) ?? options.defaultCid
  }) as Readonly<Ref<string>>

  const area = computed(() => '') as Readonly<Ref<string>>

  const canBack = computed(() => position() > initial + 1)
  /** query 导航不支持前进，前进按钮始终禁用 */
  const canForward = computed(() => false)

  function push(target: string) {
    r.push({ query: { ...r.currentRoute.value.query, fb_cid: target } })
  }

  /** 检测用户后退超过 FileBrowser 全部历史 → 调用 onExit */
  const removeExit = r.afterEach(() => {
    if (position() <= initial && options.onExit)
      options.onExit()
  })

  function dispose() {
    removeDirection()
    removeExit()
    const distance = position() - initial
    if (distance > 0)
      r.go(-distance)
  }

  return { cid, area, direction, push, canBack, canForward, dispose }
}
