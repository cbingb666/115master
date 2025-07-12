import type { PlayerContext } from './usePlayerProvide'
import { ref, shallowRef } from 'vue'
import {
  ICON_ABOUT,
  ICON_SHORTCUTS,
  ICON_STATISTICS_INFO,
} from '../utils/icon'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  action: () => void
}

/**
 * 使用右键菜单
 */
export function useContextMenu(ctx: PlayerContext) {
  /** 菜单是否显示 */
  const visible = ref(false)
  /** 菜单位置 */
  const position = shallowRef({ x: 0, y: 0 })
  /** 关于弹窗显示状态 */
  const showAbout = ref(false)
  /** 快捷键弹窗显示状态 */
  const showShortcuts = ref(false)

  /** 菜单项 */
  const menuItems: ContextMenuItem[] = [
    {
      id: 'about',
      label: '关于',
      icon: ICON_ABOUT,
      action: () => {
        showAbout.value = true
        visible.value = false
      },
    },
    {
      id: 'shortcuts',
      label: '快捷键',
      icon: ICON_SHORTCUTS,
      action: () => {
        showShortcuts.value = true
        visible.value = false
      },
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: ICON_STATISTICS_INFO,
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

  /** 处理右键事件 */
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    show(event.clientX, event.clientY)
  }

  return {
    visible,
    position,
    menuItems,
    showAbout,
    showShortcuts,
    show,
    hide,
    handleContextMenu,
  }
}
