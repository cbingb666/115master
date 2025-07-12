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
import { PlayerCoreType } from '../../hooks/playerCore/types'
import { usePlayerContext } from '../../hooks/usePlayerProvide'

/** 样式抽象 */
const styles = {
  container:
    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 drop-shadow-xl/30',
  animation: {
    wrapper: 'inline-flex items-center justify-between gap-2.5',
    dot: ['w-2.5 h-2.5 bg-white rounded-full', 'loading-dot-bounce'],
    dot1: 'loading-dot-delay-1',
    dot2: 'loading-dot-delay-2',
    dot3: 'loading-dot-delay-3',
  },
  speed: 'text-sm font-semibold text-base-content',
}

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
  animation: loading-bounce 1.4s infinite ease-in-out both;
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
