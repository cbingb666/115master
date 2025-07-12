<template>
  <Popup
    :visible="contextMenu.visible.value"
    :x="contextMenu.position.value.x"
    :y="contextMenu.position.value.y"
    :class="styles.popup"
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
            :icon="item.icon"
            :class="styles.icon"
          />
          <span>{{ item.label }}</span>
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

  <!-- 快捷键弹窗 -->
  <ShortcutsPopup
    :visible="contextMenu.showShortcuts.value"
    @update:visible="(val: boolean) => contextMenu.showShortcuts.value = val"
  />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import Popup from '../Popup/index.vue'
import AboutPopup from './AboutPopup.vue'
import ShortcutsPopup from './ShortcutsPopup.vue'

defineSlots<{
  aboutContent: () => void
}>()

const styles = {
  popup: 'p-0!',
  container: 'menu w-48',
  menuItem: 'menu-item rounded-lg',
  icon: 'size-6',
}

const { contextMenu } = usePlayerContext()
</script>
