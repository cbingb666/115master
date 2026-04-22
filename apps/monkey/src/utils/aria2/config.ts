import type { Aria2Settings } from './types'
import { GM_getValue, GM_setValue } from '$'
import { ARIA2_DEFAULT_SETTINGS } from './types'

const KEY = 'ARIA2_SETTINGS'

type Subscriber = (next: Aria2Settings) => void
const subscribers = new Set<Subscriber>()

/** 读取完整设置（缺失字段填默认值） */
export function readSettings(): Aria2Settings {
  const raw = GM_getValue<Partial<Aria2Settings> | undefined>(KEY) ?? {}
  return { ...ARIA2_DEFAULT_SETTINGS, ...raw }
}

/** 部分更新设置 */
export function writeSettings(patch: Partial<Aria2Settings>): Aria2Settings {
  const next = { ...readSettings(), ...patch }
  GM_setValue(KEY, next)
  subscribers.forEach(fn => fn(next))
  return next
}

/** 订阅变更；返回 unsubscribe */
export function subscribeSettings(cb: Subscriber): () => void {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}
