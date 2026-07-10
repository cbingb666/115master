<template>
  <button
    class="swap swap-rotate" :class="[
      styles.btn.root,
      {
        'swap-active': playerCore?.paused,
      },
    ]"
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
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  btn: {
    ...controlStyles.btn,
    root: [controlStyles.btn.root],
  },
})

const NAME = '播放/暂停'

const { playerCore, shortcuts } = usePlayerContext()

const playTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('togglePlay')
  return `${NAME}${tip}`
})
</script>
