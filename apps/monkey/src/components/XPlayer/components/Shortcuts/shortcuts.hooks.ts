import type { ComputedRef } from 'vue'
import type {
  ActionKey,
  ActionKeyBindings,
  ActionMap,
  DefaultActionKey,
  KeyBindings,
  ShortcutsPreference,
} from './shortcuts.types'
import type { PlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import {
  tryOnUnmounted,
  useEventListener,
} from '@vueuse/core'
import {
  computed,
  shallowRef,
} from 'vue'
import {
  DEFAULT_ACTION_MAP,
} from './shortcuts.actions'
import {
  DEFAULT_ACTION_KEY_BINDINGS,
} from './shortcuts.const'
import {
  getShortcutsTip as _getShortcutsTip,
  calculateAllConflicts,
  isEditableElement,
  isSameKeyBinding,
  isSameKeyBindings,
  matchAction,
} from './shortcuts.utils'

/**
 * 录制状态 Hook
 * @returns 录制状态管理
 */
export function useRecordState() {
  /**
   * 全局录制状态计数器
   * 用于跟踪当前有多少个 KeyRecorder 正在录制
   */
  const recordingCount = shallowRef(0)

  /** 检查是否正在录制 */
  const isRecording = computed(() => {
    return recordingCount.value > 0
  })

  /** 开始录制 */
  function startRecording() {
    recordingCount.value++
  }

  /** 结束录制 */
  function stopRecording() {
    recordingCount.value = Math.max(0, recordingCount.value - 1)
  }

  return {
    startRecording,
    stopRecording,
    isRecording,
  }
}

/**
 * 快捷键动作监听
 * @param ctx 播放器上下文
 */
export function useShortcutsActionListener(
  ctx: PlayerContext,
  recordState: ReturnType<typeof useRecordState>,
  mergedActionMap: ComputedRef<ActionMap>,
  mergedActionKeyBindings: ComputedRef<ActionKeyBindings>,
) {
  const cleanEventKeydown = useEventListener('keydown', handleKeydown)
  const cleanEventKeyup = useEventListener('keyup', handleKeyup)

  function handleKeydown(event: KeyboardEvent) {
    if (recordState.isRecording.value)
      return

    // 弹窗打开时不处理快捷键，避免吞掉弹窗内的交互（如 Space 激活按钮）
    if (ctx.popupManager.hasOpenPopup.value)
      return

    // 如果目标是可编辑元素，不处理快捷键
    if (isEditableElement(event.target))
      return

    const action = matchAction(
      event,
      mergedActionKeyBindings.value,
      mergedActionMap.value,
    )
    if (!action)
      return

    const modal = event.target instanceof Element
      ? event.target.closest('dialog[open]')
      : null

    if (modal && (!modal.hasAttribute('data-app-xplayer-shortcuts') || !action.action.allowInModal))
      return

    event.preventDefault()
    if (event.repeat && !action.action?.allowRepeat)
      return
    action.action?.keydown?.(ctx, event, action)
  }

  function handleKeyup(event: KeyboardEvent) {
    if (recordState.isRecording.value)
      return

    // 弹窗打开时不处理快捷键，避免吞掉弹窗内的交互（如 Space 激活按钮）
    if (ctx.popupManager.hasOpenPopup.value)
      return

    // 如果目标是可编辑元素，不处理快捷键
    if (isEditableElement(event.target))
      return

    const action = matchAction(
      event,
      mergedActionKeyBindings.value,
      mergedActionMap.value,
    )
    if (!action)
      return

    const modal = event.target instanceof Element
      ? event.target.closest('dialog[open]')
      : null

    if (modal && (!modal.hasAttribute('data-app-xplayer-shortcuts') || !action.action.allowInModal))
      return

    event.preventDefault()
    action.action.keyup?.(ctx, event, action)
  }

  function clean() {
    cleanEventKeydown()
    cleanEventKeyup()
  }

  tryOnUnmounted(clean)

  return {
    clean,
  }
}

/** 快捷键偏好 Hook */
export function useShortcutsPreference(ctx: PlayerContext) {
  const state = ctx.rootPropsVm.shortcutsPreference
  return state
}

/**
 * 快捷键设置管理 Hook
 * @param ctx 播放器上下文
 */
export function useShortcuts(ctx: PlayerContext) {
  /** 快捷键偏好 */
  const preference = useShortcutsPreference(ctx)

  /** 录制状态管理 */
  const recordState = useRecordState()

  /** 合并后的动作表 */
  const mergedActionMap = computed<ActionMap>(() => {
    return {
      ...DEFAULT_ACTION_MAP,
      ...ctx.rootProps.shortcutsExt?.actionMap || {},
    }
  })

  /** 合并后的动作映射表 */
  const mergedActionKeyBindings = computed<ActionKeyBindings>(() => {
    return {
      ...DEFAULT_ACTION_KEY_BINDINGS,
      ...(ctx.rootProps.shortcutsExt?.actionKeyBindings || {}),
      ...preference.value.actionKeyBindings,
    }
  })

  /** 合并后的默认动作映射表 (不包含用户自定义的映射) */
  const mergedDefaultActionKeyBindings = computed<ActionKeyBindings>(() => {
    return {
      ...DEFAULT_ACTION_KEY_BINDINGS,
      ...(ctx.rootProps.shortcutsExt?.actionKeyBindings || {}),
    }
  })

  /** 动作事件监听 */
  const actionListener = useShortcutsActionListener(
    ctx,
    recordState,
    mergedActionMap,
    mergedActionKeyBindings,
  )

  /** 获取动作列表（带配置信息） */
  function getActionList() {
    return Object.entries(mergedActionMap.value).map(([key, config]) => ({
      key,
      config,
      keyBindings: mergedActionKeyBindings.value[key] || [],
    }))
  }

  /** 更新单个动作的快捷键映射 */
  function updateActionKeyBindings(
    actionKey: ActionKey,
    keyBindings: KeyBindings,
  ) {
    /** 如果和默认值相同，重置 */
    const defaultKeyBindings = mergedDefaultActionKeyBindings.value[actionKey]
    if (isSameKeyBindings(keyBindings, defaultKeyBindings)) {
      resetActionKeyBindings(actionKey)
      return
    }

    /** 更新 */
    preference.value.actionKeyBindings = {
      ...preference.value.actionKeyBindings,
      [actionKey]: keyBindings,
    }
  }

  /** 重置单个动作的快捷键为默认值 */
  function resetActionKeyBindings(actionKey: ActionKey) {
    const keyBindings = { ...preference.value.actionKeyBindings }
    delete keyBindings[actionKey]
    preference.value.actionKeyBindings = keyBindings
  }

  /** 重置所有快捷键为默认值 */
  function resetAllActionKeyBindings() {
    preference.value.actionKeyBindings = {}
  }

  /** 检查是否有任何自定义配置（响应式） */
  const hasCustomConfig = computed(() => {
    // 遍历用户动作映射表
    for (
      const [
        preferenceActionKey,
        preferenceKeyBindings,
      ] of Object.entries(preference.value.actionKeyBindings)
    ) {
      const defaultKeyBindings = mergedDefaultActionKeyBindings.value[preferenceActionKey]
        || []

      // null 表示禁用，这是一种自定义
      if (preferenceKeyBindings === null) {
        // 只有当默认值不是空数组时，null 才算自定义
        if (defaultKeyBindings.length > 0) {
          return true
        }
        continue
      }

      // 检查长度
      if (preferenceKeyBindings.length !== defaultKeyBindings.length) {
        return true
      }

      /** 是否存在不同的快捷键 */
      const isDifferent = !preferenceKeyBindings
        .every((keyBinding, index) =>
          isSameKeyBinding(
            keyBinding,
            defaultKeyBindings[index],
          ),
        )

      if (isDifferent) {
        return true
      }
    }

    return false
  })

  /** 冲突映射表 */
  const conflicts = computed(() => {
    return calculateAllConflicts(mergedActionKeyBindings.value)
  })

  /** 导入偏好 */
  function importPreference(jsonStr: string): boolean {
    try {
      const raw = JSON.parse(jsonStr) as ShortcutsPreference
      preference.value = raw
      return true
    }
    catch (e) {
      alert('导入偏好失败')
      throw e
    }
  }

  /** 导出偏好 */
  function exportPreference(): string {
    return JSON.stringify(preference.value, null, 2)
  }

  /**
   * 获取动作的快捷键提示文本
   * @returns 快捷键提示文本
   */
  function getShortcutsTip(...args: (DefaultActionKey | ActionKey)[]) {
    return _getShortcutsTip(args, mergedActionKeyBindings.value)
  }

  return {
    /** 快捷键偏好 */
    preference,
    /** 冲突映射表 */
    conflicts,
    /** 录制状态管理 */
    recordState,
    /** 合并后的动作表 */
    mergedActionMap,
    /** 合并后的动作映射表 */
    mergedActionKeyBindings,
    /** 合并后的默认动作映射表 (不包含用户自定义的映射) */
    mergedDefaultActionKeyBindings,
    /** 检查是否有自定义配置 */
    hasCustomConfig,
    /** 动作事件监听 */
    actionListener,
    /** 获取动作列表 */
    getActionList,
    /** 更新单个动作的快捷键映射 */
    updateActionKeyBindings,
    /** 重置单个动作的快捷键为默认值 */
    resetActionKeyBindings,
    /** 重置所有快捷键为默认值 */
    resetAllActionKeyBindings,
    /** 导出配置 */
    exportPreference,
    /** 导入配置 */
    importPreference,
    /** 获取动作的快捷键提示文本 */
    getShortcutsTip,
  }
}
