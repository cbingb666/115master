import type { Ref } from 'vue'
import { useMouseInElement } from '@vueuse/core'
import { onUnmounted, shallowRef, watchEffect } from 'vue'
import { usePlayerContext } from './usePlayerProvide'

/**
 * 控制栏鼠标检测 Hook
 */
export function useControlsMouseDetection(elementRef: Ref<HTMLElement | null>) {
  const { controls } = usePlayerContext()

  const { isOutside } = useMouseInElement(elementRef)

  /** 跟踪是否已经添加了禁止自动隐藏状态 */
  const hasAddedDisabled = shallowRef(false)

  const stop = watchEffect(() => {
    if (!isOutside.value) {
      // 鼠标在元素内，添加禁止自动隐藏
      if (!hasAddedDisabled.value) {
        controls.addDisabledAutoHide()
        hasAddedDisabled.value = true
      }

      /** 返回清理函数，当 watchEffect 重新运行或组件卸载时执行 */
      return () => {
        if (hasAddedDisabled.value) {
          controls.removeDisabledAutoHide()
          hasAddedDisabled.value = false
        }
      }
    }

    // 鼠标在元素外，如果之前添加过禁止状态，则移除
    if (hasAddedDisabled.value) {
      controls.removeDisabledAutoHide()
      hasAddedDisabled.value = false
    }

    /** 鼠标在元素外，返回空的清理函数 */
    return () => {}
  })

  // 组件卸载时清理
  onUnmounted(() => {
    stop()
    // 确保移除任何残留的禁止状态
    if (hasAddedDisabled.value) {
      controls.removeDisabledAutoHide()
      hasAddedDisabled.value = false
    }
  })

  return {
    isOutside,
  }
}
