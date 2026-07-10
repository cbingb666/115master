<template>
  <div :class="[styles.tooltip]">
    <!-- 恢复音频提示 -->
    <div v-if="playerCore?.isSuspended" :class="[styles.tooltipContent]">
      <button
        :class="[styles.resumeBtn]"
        @click="() => {
          playerCore?.resumeSuspended();
          hud?.showResumeSuspended();
        }"
      >
        点击恢复音频 {{ muteKey }}
      </button>
    </div>

    <ControlButtonGroup direction="left" @wheel.prevent="handleWheelWithThrottle">
      <template #default>
        <button
          class="swap swap-rotate"
          :class="[styles.btn.root, {
            'swap-active': playerCore?.muted,
          }]"
          :title="muteTip"
          :disabled="!playerCore?.canplay || playerCore?.isSuspended"
          @click="playerCore?.toggleMute"
        >
          <Icon
            class="swap-off"
            :class="[styles.btn.icon]"
            :name="VolumeIcon"
          />
          <Icon
            class="swap-on"
            :class="[styles.btn.icon]"
            :name="VolumeIcon"
          />
        </button>
      </template>

      <template #expanded>
        <input
          type="range"
          :class="[styles.range]"
          min="0"
          max="100"
          :value="playerCore?.volume ?? 0"
          :disabled="!playerCore?.canplay || playerCore?.isSuspended"
          @input="handleVolumeChange"
        >
      </template>
    </ControlButtonGroup>
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core'
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { getVolumeIcon } from '@/components/XPlayer/utils/icon'
/**
 * VolumeControl 音量控制组件
 *
 * 功能说明：
 * - 点击按钮切换静音状态
 * - 鼠标悬停展开显示音量滑块
 * - 滚轮调节音量
 * - 支持音频恢复提示
 *
 * 复用 ControlButtonGroup 实现展开/折叠逻辑
 */
import { Icon } from '@/icons'
import { clsx } from '@/utils/clsx'
import ControlButtonGroup from './ControlButtonGroup.vue'

const { playerCore, hud, shortcuts } = usePlayerContext()

const styles = computed(() => clsx({
  btn: controlStyles.btn,
  range: [
    'range range-2xs range-primary',
    'w-24',
    'mx-2',
  ],
  tooltip: [
    'tooltip tooltip-top',
    {
      'tooltip-open': playerCore.value?.isSuspended,
    },
  ],
  tooltipContent: 'tooltip-content px-4 py-2',
  resumeBtn: 'pointer-events-auto cursor-pointer',
}))

const MUTE_NAME = '静音'

const handleWheelWithThrottle = useThrottleFn(handleWheel, 60)

const VolumeIcon = computed(() => {
  return getVolumeIcon(
    playerCore.value?.volume ?? 0,
    playerCore.value?.muted ?? false,
  )
})

const muteKey = computed(() => {
  const tip = shortcuts.getShortcutsTip('toggleMute')
  return tip
})

const muteTip = computed(() => {
  return `${MUTE_NAME}${muteKey.value}`
})

function handleVolumeChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  playerCore.value?.setVolume(value)
}

function handleWheel(event: WheelEvent) {
  if (!playerCore.value?.canplay || playerCore.value?.isSuspended) {
    return
  }

  const delta = event.deltaY > 0 ? 5 : -5
  const currentVolume = playerCore.value.volume ?? 0
  const newVolume = Math.min(Math.max(0, currentVolume + delta), 100)
  playerCore.value.setVolume(newVolume)
}
</script>
