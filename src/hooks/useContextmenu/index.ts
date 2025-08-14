import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { shallowRef } from 'vue'

export function useContextmenu(targetRef: Ref, callback?: (e: MouseEvent) => void) {
  const pos = shallowRef<{ x: number, y: number }>({ x: 0, y: 0 })
  const maybeIsContextmenu = shallowRef(false)
  const isContextmenu = shallowRef(false)

  useEventListener(targetRef, 'contextmenu', (e: MouseEvent) => {
    console.log('contextmenu')
    e.preventDefault()
    pos.value = {
      x: e.screenX,
      y: e.screenY,
    }
    maybeIsContextmenu.value = true
  })

  useEventListener(targetRef, 'mouseup', (e: MouseEvent) => {
    if (maybeIsContextmenu.value) {
      const distance = Math.sqrt((e.screenX - pos.value.x) ** 2 + (e.screenY - pos.value.y) ** 2)
      if (distance < 2) {
        callback?.(e)
        isContextmenu.value = true
      }
    }
    maybeIsContextmenu.value = false
  })

  return {
    pos,
    isContextmenu,
  }
}
