import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { onBeforeUnmount, ref } from 'vue'

export interface UseLongPressOptions {
  /** 触发阈值（ms），默认 500 */
  threshold?: number
  /** 位移容忍（px），超过判定为滚动而取消，默认 10 */
  moveTolerance?: number
  /** 触发回调 */
  onTrigger: (e: PointerEvent) => void
}

/**
 * 长按手势：触屏/笔按下并保持 threshold 触发；移动超容忍或抬起则取消。
 * 鼠标不触发（避免桌面鼠标长按歧义）。
 * 返回 fired 标志——触发后置 true，调用方据此吞掉随后合成的 click。
 */
export function useLongPress(target: Ref<HTMLElement | undefined>, options: UseLongPressOptions) {
  const { threshold = 500, moveTolerance = 10, onTrigger } = options
  const fired = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let startX = 0
  let startY = 0

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.removeEventListener('pointercancel', onUp)
  }

  function onMove(e: PointerEvent) {
    if (!timer)
      return
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > moveTolerance)
      clear()
  }

  function onUp() {
    clear()
  }

  function onDown(e: PointerEvent) {
    if (e.pointerType === 'mouse')
      return
    startX = e.clientX
    startY = e.clientY
    timer = setTimeout(() => {
      fired.value = true
      clear()
      onTrigger(e)
    }, threshold)
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  useEventListener(target, 'pointerdown', onDown)
  onBeforeUnmount(clear)

  return fired
}
