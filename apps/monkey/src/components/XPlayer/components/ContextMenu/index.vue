<template>
  <Popup
    :visible="contextMenu.visible.value"
    :x="contextMenu.position.value.x"
    :y="contextMenu.position.value.y"
    @update:visible="contextMenu.hide"
  >
    <ul :class="styles.container">
      <li
        v-for="item in contextMenu.menuItems"
        :key="item.id"
      >
        <a
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
        </a>
      </li>
    </ul>
  </Popup>

  <!-- 关于弹窗 -->
  <AboutPopup
    :visible="contextMenu.showAbout.value"
    @update:visible="(val: boolean) => contextMenu.showAbout.value = val"
  >
    <template #content>
      <slot name="aboutContent" />
    </template>
  </AboutPopup>

  <!-- 偏好设置弹窗 -->
  <PlayerSettingsPopup
    :visible="contextMenu.showSettings.value"
    :default-tab="contextMenu.defaultSettingsTab.value"
    @update:visible="(val: boolean) => contextMenu.showSettings.value = val"
  />
</template>

<script setup lang="ts">
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import PlayerSettingsPopup from '@/components/XPlayer/components/Settings/PlayerSettingsPopup.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { Icon } from '@/icons'
import { clsx } from '@/utils/clsx'
import AboutPopup from './AboutPopup.vue'

defineSlots<{
  aboutContent: () => void
}>()

const styles = clsx({
  container: 'menu',
  menuItem: 'menu-item rounded-xl px-3',
  icon: 'size-5',
  label: 'flex-1 text-sm font-medium',
  shortcuts: 'ml-4 text-xs font-bold opacity-30',
})

const { contextMenu, shortcuts } = usePlayerContext()
</script>
