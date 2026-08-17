import type { PlayerContext } from './usePlayerProvide'
import type { ActionKey } from '@/components/XPlayer/components/Shortcuts/shortcuts.types'
import type { IconValue } from '@/icons'
import { ref, shallowRef } from 'vue'
import { I } from '@/icons'

/** 设置标签页类型 */
export type SettingsTab = 'play' | 'shortcuts'

export interface ContextMenuItem {
  /**
   * ID
   */
  id: string
  /**
   * 菜单名
   */
  label: string
  /**
   * 图标
   */
  icon?: IconValue
  /**
   * 动作
   * @description 快捷键动作
   */
  action: () => void
  /**
   * 快捷键 ActionKey
   * @description 用于显示快捷键提示
   */
  actionKey?: ActionKey
}

/**
 * 使用右键菜单
 */
export function useContextMenu(ctx: PlayerContext) {
  /** 菜单是否显示 */
  const visible = ref(false)
  /** 菜单位置 */
  const position = shallowRef({ x: 0, y: 0 })
  /** 设置弹窗显示状态 */
  const showSettings = ref(false)
  /** 设置弹窗默认 tab */
  const defaultSettingsTab = ref<SettingsTab>('play')

  /** 菜单项 */
  const menuItems: ContextMenuItem[] = [
    {
      id: 'settings',
      label: '偏好设置',
      icon: I.SETTINGS,
      actionKey: 'shortcuts',
      action: () => {
        defaultSettingsTab.value = 'play'
        showSettings.value = true
        visible.value = false
      },
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: I.STATISTICS_INFO,
      actionKey: 'statistics',
      action: () => {
        ctx.statistics.toggleVisible()
        visible.value = false
      },
    },
  ]

  /** 显示菜单 */
  const show = (x: number, y: number) => {
    /** 获取播放器容器的位置 */
    const rootRect = ctx.refs.rootRef.value?.getBoundingClientRect()

    if (rootRect) {
      // 计算相对于播放器容器的位置
      position.value = {
        x: x - rootRect.left,
        y: y - rootRect.top,
      }
    }
    else {
      position.value = { x, y }
    }

    visible.value = true
  }

  /** 隐藏菜单 */
  const hide = () => {
    visible.value = false
  }

  /** 打开设置弹窗 */
  const openSettings = (tab: SettingsTab = 'play') => {
    defaultSettingsTab.value = tab
    showSettings.value = true
  }

  /** 处理右键事件 */
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    show(event.clientX, event.clientY)
  }

  return {
    visible,
    position,
    menuItems,
    showSettings,
    defaultSettingsTab,
    show,
    hide,
    handleContextMenu,
    openSettings,
  }
}
