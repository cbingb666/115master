<template>
  <button
    class="btn btn-ghost btn-circle tooltip"
    :class="{ 'swap-active': !fullscreen.isFullscreen.value }"
    data-tip="全屏 (F)"
    @click="fullscreen.toggleFullscreen"
  >
    <Icon class="size-7" :icon="icon" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'

const { fullscreen } = usePlayerContext()
const icon = computed(() => {
  return fullscreen.isFullscreen.value
    ? 'material-symbols:fullscreen-exit-rounded'
    : 'material-symbols:fullscreen-rounded'
})
</script>
