<template>
  <Popup
    :visible="contextMenu.visible.value"
    :x="contextMenu.position.value.x"
    :y="contextMenu.position.value.y"
    @update:visible="contextMenu.hide"
  >
    <ul
      :class="styles.container"
      role="menu"
      @keydown="onMenuKeydown"
    >
      <li
        v-for="(item, index) in contextMenu.menuItems"
        :key="item.id"
      >
        <button
          :ref="(el) => setMenuItemRef(el, index)"
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
import { nextTick, watch } from 'vue'
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

/** 菜单项元素（v-for 索引对应） */
const menuItemRefs: (HTMLButtonElement | null)[] = []

function setMenuItemRef(el: unknown, index: number) {
  menuItemRefs[index] = (el as HTMLButtonElement | null) ?? null
}

/** 方向键 / Tab 在菜单项间循环聚焦 */
function focusItem(delta: number) {
  const items = menuItemRefs.filter((el): el is HTMLButtonElement => !!el)
  if (items.length === 0)
    return
  const index = items.indexOf(document.activeElement as HTMLButtonElement)
  const next = index === -1
    ? (delta > 0 ? 0 : items.length - 1)
    : (index + delta + items.length) % items.length
  items[next].focus()
}

function onMenuKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusItem(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusItem(-1)
      break
    case 'Home':
      event.preventDefault()
      menuItemRefs.find(Boolean)?.focus()
      break
    case 'End':
      event.preventDefault()
      menuItemRefs.filter(Boolean).slice(-1)[0]?.focus()
      break
    case 'Tab':
      // 菜单开启期间焦点保持在菜单内循环
      event.preventDefault()
      focusItem(event.shiftKey ? -1 : 1)
      break
  }
}

// 菜单打开时聚焦首个菜单项，保证 Esc / 方向键立即可用
watch(contextMenu.visible, async (visible) => {
  if (!visible)
    return
  await nextTick()
  menuItemRefs.find(Boolean)?.focus()
})
</script>
