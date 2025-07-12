import type { PlayerContext } from './usePlayerProvide'
import { computed, reactive, watch } from 'vue'

interface Popup {
  /** 是否可见 */
  visible: boolean
  /** 触发元素 */
  trigger?: HTMLElement
  /** 容器元素 */
  container: HTMLElement
  /** 弹出层容器元素 */
  portalContainer: HTMLElement
  /** 是否允许阻止控制栏关闭 */
  allowPreventControlsClose: boolean
}

/**
 * Popup管理器
 * 用于跟踪全局popup状态，防止控制栏在有popup打开时自动隐藏
 */
export function usePopupManager(ctx: PlayerContext) {
  const popups = reactive(new Map<string, Popup>())

  const disabledBubblingElements = new Set<HTMLElement>()

  /** 注册popup */
  const registerPopup = (id: string, popup: Popup) => {
    popups.set(id, popup)
  }

  /** 注销popup */
  const unregisterPopup = (id: string) => {
    popups.delete(id)
  }

  /** 设置popup可见性 */
  const setPopupVisible = (id: string, visible: boolean) => {
    const popup = popups.get(id)
    if (popup) {
      popup.visible = visible
    }
  }

  /** 是否有任何popup打开 */
  const hasOpenPopup = computed(() =>
    Array.from(popups.values()).some(
      popup => popup.visible && popup.allowPreventControlsClose,
    ),
  )

  /** 添加阻止冒泡元素 */
  const addDisabledBubblingElement = (element: HTMLElement) => {
    disabledBubblingElements.add(element)
  }

  /** 移除阻止冒泡元素 */
  const removeDisabledBubblingElement = (element: HTMLElement) => {
    disabledBubblingElements.delete(element)
  }

  watch(hasOpenPopup, (value) => {
    if (value) {
      ctx.controls.addDisabledAutoHide()
      ctx.controls.setDisabledHideOnMouseLeave(true)
    }
    else {
      ctx.controls.removeDisabledAutoHide()
      ctx.controls.setDisabledHideOnMouseLeave(false)
    }
  })

  return {
    hasOpenPopup,
    disabledBubblingElements,
    registerPopup,
    unregisterPopup,
    setPopupVisible,
    addDisabledBubblingElement,
    removeDisabledBubblingElement,
  }
}
