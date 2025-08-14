<template>
  <div
    :class="[
      styles.root,
      {
        'opacity-0': !playerCore?.canplay,
        'opacity-100': playerCore?.canplay,
      },
    ]"
    class="transition-opacity duration-200"
  >
    <span>{{ formatTime(playerCore?.currentTime) }}</span>
    <span :class="styles.separator">/</span>
    <span>{{ formatTime(playerCore?.duration) }}</span>
  </div>
</template>

<script setup lang="ts">
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { formatTime } from '@/components/XPlayer/utils/time'

const { playerCore } = usePlayerContext()

const styles = {
  root: [controlStyles.text, 'flex items-center gap-1.5 select-none'],
  separator: controlStyles.subtext,
}
</script>
