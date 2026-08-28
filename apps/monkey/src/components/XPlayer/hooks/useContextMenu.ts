import type { ActionMenuGroup } from '@115master/ui'
import type { PlayerContext } from './usePlayerProvide'
import { ref, shallowRef } from 'vue'
import { I } from '@/icons'
import { actionIcon } from '@/utils/action'

/** 设置标签页类型 */
export type SettingsTab = 'play' | 'shortcuts'

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
  const groups: ActionMenuGroup[] = [
    [
      {
        id: 'settings',
        label: '偏好设置',
        leading: actionIcon(I.SETTINGS),
        hint: () => ctx.shortcuts.getShortcutsTip('shortcuts'),
        onSelect: () => {
          defaultSettingsTab.value = 'play'
          showSettings.value = true
        },
      },
      {
        id: 'statistics',
        label: 'Statistics',
        leading: actionIcon(I.STATISTICS_INFO),
        hint: () => ctx.shortcuts.getShortcutsTip('statistics'),
        onSelect: () => ctx.statistics.toggleVisible(),
      },
    ],
  ]

  /** 打开设置弹窗 */
  const openSettings = (tab: SettingsTab = 'play') => {
    defaultSettingsTab.value = tab
    showSettings.value = true
  }

  /** 处理右键事件 */
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    position.value = { x: event.clientX, y: event.clientY }
    visible.value = true
  }

  return {
    visible,
    position,
    groups,
    showSettings,
    defaultSettingsTab,
    handleContextMenu,
    openSettings,
  }
}
