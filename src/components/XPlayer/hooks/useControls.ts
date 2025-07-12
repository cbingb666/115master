import type { PlayerContext } from './usePlayerProvide'
import { useDebounceFn, useEventListener, useThrottleFn } from '@vueuse/core'
import { computed, onUnmounted, shallowRef, watch } from 'vue'

/** 延迟隐藏控制栏时间 */
const DELAY_HIDE_CONTROLS_TIME = 1000
/** 控制栏鼠标移动节流时间 */
const ROOT_MOUSE_MOVE_THROTTLE_TIME = 200
/** 控制栏鼠标离开防抖时间 */
const ROOT_MOUSE_LEAVE_DEBOUNCE_TIME = 30
/** 控制栏锁定时间 */
const LOCK_CONTROLS_TIMEOUT = 1000

/** 控制栏 */
export function useControls(ctx: PlayerContext) {
  const mainRef = shallowRef<HTMLDivElement | null>(null)

  /** 控制栏是否显示 */
  const visible = shallowRef(true)

  /** 禁止自动隐藏的引用计数 */
  const disabledAutoHideCount = shallowRef(0)

  /** 是否禁止自动隐藏控制栏（基于引用计数） */
  const disabledAutoHide = computed(() => disabledAutoHideCount.value > 0)

  /** 是否禁止鼠标离开控制栏 */
  const disabledHideOnMouseLeave = shallowRef(false)

  /** 隐藏控制栏计时器 */
  let hideControlsTimer: number | null = null

  /** 控制栏离开隐藏锁定计时器 */
  let hideControlsLeaveLockTimer: number | null = null

  /** 控制栏高度 */
  const controlsMainHeight = computed(() => {
    return mainRef.value?.offsetHeight
  })

  /** 显示控制栏 */
  const show = () => {
    visible.value = true
  }

  /** 隐藏控制栏 */
  const hide = () => {
    visible.value = false
  }

  /** 清除隐藏控制栏计时器 */
  const stopAutoHideTimer = () => {
    if (hideControlsTimer) {
      clearTimeout(hideControlsTimer)
      hideControlsTimer = null
    }
  }

  /** 处理自动隐藏控制栏 */
  const handleAutoHide = () => {
    if (disabledAutoHide.value) {
      return
    }
    hide()
  }

  /** 延迟隐藏控制栏 */
  const startAutoHideTimer = () => {
    if (disabledAutoHide.value) {
      return
    }
    stopAutoHideTimer()
    hideControlsTimer = window.setTimeout(
      handleAutoHide,
      DELAY_HIDE_CONTROLS_TIME,
    )
  }

  /** 增加禁止自动隐藏的引用计数 */
  const addDisabledAutoHide = () => {
    disabledAutoHideCount.value++
    if (disabledAutoHideCount.value === 1) {
      stopAutoHideTimer()
    }
  }

  /** 减少禁止自动隐藏的引用计数 */
  const removeDisabledAutoHide = () => {
    disabledAutoHideCount.value = Math.max(0, disabledAutoHideCount.value - 1)
  }

  /** 设置是否禁止自动隐藏控制栏（保持向后兼容） */
  const setDisabledAutoHide = (value: boolean) => {
    if (value) {
      addDisabledAutoHide()
    }
    else {
      removeDisabledAutoHide()
    }
  }

  /** 设置是否禁止鼠标离开控制栏 */
  const setDisabledHideOnMouseLeave = (value: boolean) => {
    disabledHideOnMouseLeave.value = value
  }

  /**
   * 锁定控制栏，在指定时间后自动解锁
   * @description
   * 1. 锁定期间，控制栏不会自动隐藏
   * 2. 锁定期间，鼠标离开控制栏不会触发隐藏
   * 3. 超时解锁后，恢复上锁前的状态
   * @param timeout 锁定时间，单位：毫秒
   */
  const lockControlsWithTimeoutUnlock = (timeout = LOCK_CONTROLS_TIMEOUT) => {
    if (hideControlsLeaveLockTimer) {
      clearTimeout(hideControlsLeaveLockTimer)
    }

    disabledHideOnMouseLeave.value = true
    stopAutoHideTimer()
    hideControlsLeaveLockTimer = window.setTimeout(() => {
      disabledHideOnMouseLeave.value = false
      startAutoHideTimer()
    }, timeout)
  }

  /** 鼠标移动 */
  const handleRootMouseMove = useThrottleFn(() => {
    show()
    startAutoHideTimer()
  }, ROOT_MOUSE_MOVE_THROTTLE_TIME)

  /** 鼠标离开 */
  const handleRootMouseLeave = useDebounceFn(() => {
    if (disabledHideOnMouseLeave.value) {
      return
    }

    stopAutoHideTimer()
    hide()
  }, ROOT_MOUSE_LEAVE_DEBOUNCE_TIME)

  // 监听控制栏高度
  watch([visible, controlsMainHeight], () => {
    if (!ctx.cssVar) {
      return
    }

    if (visible.value) {
      ctx.cssVar.safeAreaBottom.value = `${controlsMainHeight.value}px`
    }
    else {
      ctx.cssVar.safeAreaBottom.value = '0px'
    }
  })

  // 监听
  useEventListener(ctx.refs.rootRef, 'mousemove', handleRootMouseMove)
  useEventListener(ctx.refs.rootRef, 'mouseleave', handleRootMouseLeave)

  onUnmounted(() => {
    stopAutoHideTimer()
  })

  return {
    visible,
    mainRef,
    disabledHideOnMouseLeave,
    disabledAutoHide,
    setDisabledAutoHide,
    setDisabledHideOnMouseLeave,
    lockControlsWithTimeoutUnlock,
    addDisabledAutoHide,
    removeDisabledAutoHide,
    startAutoHideTimer,
    stopAutoHideTimer,
  }
}
