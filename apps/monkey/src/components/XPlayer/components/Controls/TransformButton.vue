<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    title="画面变换"
    @click="toggleMenu"
  >
    <Icon
      :class="[ styles.btn.icon ]"
      :name="I.TRANSFORM"
    />
  </button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
    :class="[styles.popup]"
  >
    <TransformSettings />
  </Popup>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'
import TransformSettings from './TransformSettings.vue'

const styles = clsx({
  ...controlStyles,
  popup: [
    'p-2',
    'select-none',
  ],
})

const buttonRef = shallowRef<HTMLElement>()
const menuVisible = shallowRef(false)
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}
</script>
