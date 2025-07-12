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
import { controlStyles } from '../../styles/common'
import { ICON_SETTINGS } from '../../utils/icon'
import Popup from '../Popup/index.vue'
import PlaySettings from './PlaySettings.vue'
import ThumbnailSettings from './ThumbnailSettings.vue'
import TransformSettings from './TransformSettings.vue'

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
