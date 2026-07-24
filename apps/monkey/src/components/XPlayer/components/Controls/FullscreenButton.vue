<template>
  <Button
    variant="ghost"
    shape="circle"
    :class="{ 'swap-active': !fullscreen.isFullscreen.value }"
    :title="fullscreenTip"
    @click="fullscreen.toggleFullscreen"
  >
    <Icon class="size-7" :name="icon" />
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { I, Icon } from '@/icons'
import Button from '../../../Button/Button'

const { fullscreen, shortcuts } = usePlayerContext()

const icon = computed(() => {
  return fullscreen.isFullscreen.value
    ? I.FULLSCREEN_EXIT
    : I.FULLSCREEN
})

const NAME = '全屏'

const fullscreenTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('toggleFullscreen')
  return `${NAME}${tip}`
})
</script>
