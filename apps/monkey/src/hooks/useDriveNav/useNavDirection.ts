import type { Router } from 'vue-router'
import type { NavigationDirection } from './types'
import { shallowRef, watch } from 'vue'

/**
 * 共享导航方向检测 — 通过 history.state.position 差值判断 forward/back/replace
 *
 * 返回的 `remove` 用于销毁内部 watcher。
 * 若调用方绑定在应用级 store（如 usePathNav），watcher 与应用同生命周期，无需手动 remove。
 */
export function useNavDirection(r: Router) {
  const direction = shallowRef<NavigationDirection>('forward')
  let prev = (history.state?.position as number) ?? 0

  /** flush:'sync' 保证 direction 在所有 pre-flush watcher 之前更新 */
  const remove = watch(r.currentRoute, () => {
    const pos = (history.state?.position as number) ?? 0
    if (pos > prev)
      direction.value = 'forward'
    else if (pos < prev)
      direction.value = 'back'
    else
      direction.value = 'replace'
    prev = pos
  }, { flush: 'sync' })

  return { direction, position: () => prev, remove }
}
