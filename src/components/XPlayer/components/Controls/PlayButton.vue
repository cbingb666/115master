<template>
  <button
    class="swap swap-rotate" :class="[
      styles.btn.root,
      {
        'swap-active': playerCore?.paused,
      },
    ]"
    :disabled="!playerCore?.canplay"
    data-tip="播放/暂停 (Space)"
    @click="playerCore?.togglePlay"
  >
    <Icon
      :icon="ICON_PASUE" class="swap-off" :class="[
        styles.btn.icon,
      ]"
    />
    <Icon
      :icon="ICON_PLAY" class="swap-on" :class="[
        styles.btn.icon,
      ]"
    />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import { ICON_PASUE, ICON_PLAY } from '../../utils/icon'

const styles = {
  btn: {
    ...controlStyles.btn,
    root: [controlStyles.btn.root, 'before:ml-8'],
  },
}

const { playerCore } = usePlayerContext()
</script>
