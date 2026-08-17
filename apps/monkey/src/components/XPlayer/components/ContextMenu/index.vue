<template>
  <UiContextMenu
    :open="contextMenu.visible.value"
    :position="contextMenu.position.value"
    aria-label="播放器操作"
    @update:open="(visible: boolean) => contextMenu.visible.value = visible"
  >
    <ul role="group">
      <li
        v-for="item in contextMenu.menuItems"
        :key="item.id"
        role="none"
      >
        <button
          type="button"
          role="menuitem"
          :class="styles.menuItem"
          @click="item.action"
        >
          <Icon
            v-if="item.icon"
            :name="item.icon"
            :class="styles.icon"
          />
          <span :class="styles.label">{{ item.label }}</span>
          <span v-if="item.actionKey" :class="styles.shortcuts">
            {{ shortcuts.getShortcutsTip(item.actionKey) }}
          </span>
        </button>
      </li>
    </ul>
  </UiContextMenu>

  <!-- 偏好设置弹窗 -->
  <PlayerSettingsPopup
    :visible="contextMenu.showSettings.value"
    :default-tab="contextMenu.defaultSettingsTab.value"
    @update:visible="(val: boolean) => contextMenu.showSettings.value = val"
  />
</template>

<script setup lang="ts">
import { ContextMenu as UiContextMenu } from '@115master/ui'
import PlayerSettingsPopup from '@/components/XPlayer/components/Settings/PlayerSettingsPopup.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  menuItem: 'menu-item rounded-xl px-3',
  icon: 'size-5',
  label: 'flex-1 text-sm font-medium',
  shortcuts: 'ml-4 text-xs font-bold opacity-30',
})

const { contextMenu, shortcuts } = usePlayerContext()
</script>
