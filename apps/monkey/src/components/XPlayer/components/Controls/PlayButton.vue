<template>
  <Button
    variant="ghost"
    shape="circle"
    class="swap swap-rotate"
    :class="{ 'swap-active': playerCore?.paused }"
    :disabled="!playerCore?.canplay"
    :title="playTip"
    @click="playerCore?.togglePlay"
  >
    <Icon
      :name="I.PAUSE" class="swap-off" :class="[
        styles.btn.icon,
      ]"
    />
    <Icon
      :name="I.PLAY" class="swap-on" :class="[
        styles.btn.icon,
      ]"
    />
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import Button from '../../../Button/Button'

const styles = controlStyles

const NAME = '播放/暂停'

const { playerCore, shortcuts } = usePlayerContext()

const playTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('togglePlay')
  return `${NAME}${tip}`
})
</script>
