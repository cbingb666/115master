<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    data-tip="设置"
    @click="toggleMenu"
  >
    <Icon
      class="transition-transform" :class="[
        styles.btn.icon,
        {
          'rotate-90': menuVisible,
        },
      ]"
      :icon="ICON_SETTINGS"
    />
  </button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
    :class="[styles.popup]"
  >
    <div :class="[styles.panel.root]">
      <PlaySettings />
      <ThumbnailSettings />
      <TransformSettings />
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { shallowRef } from 'vue'
import PlaySettings from '@/components/XPlayer/components/Controls/PlaySettings.vue'
import ThumbnailSettings from '@/components/XPlayer/components/Controls/ThumbnailSettings.vue'
import TransformSettings from '@/components/XPlayer/components/Controls/TransformSettings.vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { ICON_SETTINGS } from '@/components/XPlayer/utils/icon'

const styles = {
  ...controlStyles,
  panel: {
    root: 'grid grid-cols-3 gap-3 p-1 w-full max-w-2xl',
  },
  popup: 'select-none',
}

const buttonRef = shallowRef<HTMLElement>()
const menuVisible = shallowRef(false)
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}
</script>
