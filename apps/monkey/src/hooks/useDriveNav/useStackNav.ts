import type { ComputedRef } from 'vue'
import type { NavSource } from './types'
import { computed, shallowRef } from 'vue'

/** 内存栈导航源 — FileBroswer 用 */
export function useStackNav(initial: string): NavSource & {
  push: (cid: string) => void
  back: () => void
  forward: () => void
  canBack: ComputedRef<boolean>
  canForward: ComputedRef<boolean>
} {
  const stack = shallowRef<string[]>([initial])
  const cursor = shallowRef(0)
  const direction = shallowRef<NavSource['direction']['value']>('forward')

  const cid = computed(() => stack.value[cursor.value])
  const area = computed(() => '')

  const canBack = computed(() => cursor.value > 0)
  const canForward = computed(() => cursor.value < stack.value.length - 1)

  function push(target: string) {
    const next = stack.value.slice(0, cursor.value + 1)
    next.push(target)
    stack.value = next
    cursor.value = next.length - 1
    direction.value = 'forward'
  }

  function back() {
    if (!canBack.value)
      return
    cursor.value--
    direction.value = 'back'
  }

  function forward() {
    if (!canForward.value)
      return
    cursor.value++
    direction.value = 'forward'
  }

  return { cid, area, direction, push, back, forward, canBack, canForward }
}
