<template>
  <div
    :class="[
      styles.tooltip,
    ]"
  >
    <div v-if="playerCore?.isSuspended" :class="[styles.tooltipContent]">
      <button
        :class="[styles.resumeBtn]"
        @click="() => {
          playerCore?.resumeSuspended();
          hud?.showResumeSuspended();
        }"
      >
        点击恢复音频
      </button>
    </div>
    <div :class="[styles.root]">
      <button
        class="swap swap-rotate" :class="[styles.btn.root, {
          'swap-active': playerCore?.muted,
        }]"
        data-tip="静音 (M)"
        :disabled="!playerCore?.canplay || playerCore?.isSuspended"
        @click="playerCore?.toggleMute"
      >
        <Icon
          class="swap-off" :class="[styles.btn.icon]"
          :icon="VolumeIcon"
        />
        <Icon
          class="swap-on" :class="[styles.btn.icon]"
          :icon="VolumeIcon"
        />
      </button>
      <input
        type="range"
        :class="[styles.range]"
        min="0"
        max="100"
        :value="playerCore?.volume ?? 0"
        :disabled="!playerCore?.canplay || playerCore?.isSuspended"
        @input="handleVolumeChange"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import { getVolumeIcon } from '../../utils/icon'

const { playerCore, hud } = usePlayerContext()

const styles = computed(() => ({
  root: 'flex items-center gap-2 mr-2',
  btn: controlStyles.btn,
  range: ['range range-2xs w-24 range-primary'],
  tooltip: [
    'tooltip tooltip-top',
    {
      'tooltip-open': playerCore?.value?.isSuspended,
    },
  ],
  tooltipContent: 'tooltip-content py-2 px-4',
  resumeBtn: 'cursor-pointer pointer-events-auto',
}))

const VolumeIcon = computed(() => {
  return getVolumeIcon(
    playerCore.value?.volume ?? 0,
    playerCore.value?.muted ?? false,
  )
})

function handleVolumeChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  playerCore.value?.setVolume(value)
}
</script>
