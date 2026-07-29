<template>
  <div
    :class="styles.root"
    :data-canplay="playerCore?.canplay"
  >
    {{ formatTime(playerCore?.currentTime) }} /
    {{ formatTime(playerCore?.duration) }}
  </div>
</template>

<script setup lang="ts">
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { formatTime } from '@/components/XPlayer/utils/time'
import { clsx } from '@/utils/clsx'

const { playerCore } = usePlayerContext()

const styles = clsx({
  root: [
    'flex justify-center select-none',
    'px-2',
    'min-w-38',
    'text-lg',
    'text-base-content',
    'tracking-tight',
    'font-medium',
    'app-font-time',
    '[&>span]:align-middle',
  ],
})
</script>
