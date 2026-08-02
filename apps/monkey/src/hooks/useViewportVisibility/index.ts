import type { Ref } from 'vue'
import { onBeforeUnmount, ref, watch } from 'vue'

type VisibilityListener = (visible: boolean) => void

const listeners = new Map<Element, VisibilityListener>()
let observer: IntersectionObserver | undefined

function getObserver() {
  if (typeof IntersectionObserver === 'undefined')
    return undefined

  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries)
      listeners.get(entry.target)?.(entry.isIntersecting)
  })

  return observer
}

function release(element: Element) {
  observer?.unobserve(element)
  listeners.delete(element)

  if (listeners.size === 0) {
    observer?.disconnect()
    observer = undefined
  }
}

/**
 * 使用单个 IntersectionObserver 跟踪所有调用方，避免长列表为每一项创建 observer。
 * 不支持 IntersectionObserver 时按可见处理，保留原有交互。
 */
export function useViewportVisibility(target: Ref<HTMLElement | undefined>) {
  const visible = ref(typeof IntersectionObserver === 'undefined')
  let observed: HTMLElement | undefined

  function observe(element: HTMLElement | undefined) {
    if (observed === element)
      return

    if (observed)
      release(observed)

    observed = element
    if (!element)
      return

    const sharedObserver = getObserver()
    if (!sharedObserver) {
      visible.value = true
      return
    }

    visible.value = false
    listeners.set(element, (value) => {
      visible.value = value
    })
    sharedObserver.observe(element)
  }

  watch(target, observe, { flush: 'post', immediate: true })
  onBeforeUnmount(() => {
    if (observed)
      release(observed)
  })

  return visible
}
