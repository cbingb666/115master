<template>
  <div :class="styles.container">
    <div :class="styles.animation.wrapper">
      <span :class="[styles.animation.dot, styles.animation.dot1]" />
      <span :class="[styles.animation.dot, styles.animation.dot2]" />
      <span :class="[styles.animation.dot, styles.animation.dot3]" />
    </div>

    <div
      v-if="playerCore?.type === PlayerCoreType.AvPlayer && (playerCore.stats?.bandwidth ?? 0) > 0"
      :class="styles.speed"
    >
      {{ Math.round((playerCore.stats?.bandwidth ?? 0) / 1024 / 1024 * 100) / 100 }} Mbps/s
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlayerCoreType } from '@/components/XPlayer/hooks/playerCore/types'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

/** 样式抽象 */
const styles = clsx({
  container:
    'absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 drop-shadow-xl/30',
  animation: {
    wrapper: 'inline-flex items-center justify-between gap-2.5',
    dot: ['h-2.5 w-2.5 rounded-full bg-white', 'loading-dot-bounce'],
    dot1: 'loading-dot-delay-1',
    dot2: 'loading-dot-delay-2',
    dot3: 'loading-dot-delay-3',
  },
  speed: 'text-sm font-semibold text-white',
})

const { playerCore } = usePlayerContext()
</script>

<style scoped>
/* Loading动画关键帧定义 */
@keyframes loading-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Loading动画基础类 */
.loading-dot-bounce {
  animation: loading-bounce 1.4s infinite var(--ui-ease-standard) both;
}

/* 延迟动画类 */
.loading-dot-delay-1 {
  animation-delay: -0.32s;
}

.loading-dot-delay-2 {
  animation-delay: -0.16s;
}

.loading-dot-delay-3 {
  animation-delay: 0s;
}
</style>
