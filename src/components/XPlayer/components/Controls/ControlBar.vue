<template>
  <transition
    enter-active-class="transition-all duration-200 ease-out"
    leave-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      ref="controlBarRef"
      :class="styles.controlBar.main"
    >
      <!-- 背景渐变 -->
      <div :class="[styles.controlBar.bg]" />
      <!-- 视频控制栏 -->
      <div
        :ref="controls.mainRef"
        :class="[styles.controlBar.mainContent]"
      >
        <!-- 进度条 -->
        <ProgressBar
          :class="{
            'opacity-0 pointer-events-none': !canplay,
            'opacity-100 pointer-events-auto': canplay,
          }"
        />
        <div
          :class="[styles.controlBar.bar, {
            [styles.controlBar.trivialize]: progressBar?.isLongPressDragging.value,
          }]"
        >
          <div :class="styles.controlBar.left">
            <!-- 播放按钮 -->
            <PlayButton />
            <!-- 音量控制 -->
            <VolumeControl />
            <!-- 时间显示 -->
            <TimeDisplay />
          </div>
          <div :class="styles.controlBar.right">
            <!-- 画质控制 -->
            <QualityButton />
            <!-- 倍速控制 -->
            <PlaybackRateButton />
            <!-- 字幕控制 -->
            <SubtitleButton />
            <!-- 音频 Track -->
            <AudioTrackButton />
            <!-- 播放器核心 -->
            <PlayerCoreButton />
            <!-- 颜色调整 -->
            <VideoEnhanceSettings />
            <!-- 设置 -->
            <SettingsButton />
            <!-- 画中画 -->
            <PipButton />
            <!-- 全屏控制 -->
            <FullscreenButton />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useControlsMouseDetection } from '../../hooks/useControlsMouseDetection'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import AudioTrackButton from './AudioTrackButton.vue'
import FullscreenButton from './FullscreenButton.vue'
import PipButton from './PipButton.vue'
import PlaybackRateButton from './PlaybackRateButton.vue'
import PlayButton from './PlayButton.vue'
import PlayerCoreButton from './PlayerCoreButton.vue'
import ProgressBar from './ProgressBar.vue'
import QualityButton from './QualityButton.vue'
import SettingsButton from './SettingsButton.vue'
import SubtitleButton from './SubtitleButton.vue'
import TimeDisplay from './TimeDisplay.vue'
import VideoEnhanceSettings from './VideoEnhanceSettings.vue'
import VolumeControl from './VolumeControl.vue'

/** 样式抽象 */
const styles = {
  controlBar: {
    main: 'relative pointer-events-auto',
    bg: [
      'absolute inset-0 top-[-30px] pointer-events-none',
      'bg-linear-to-t from-black/50 from-10% to-transparent',
    ],
    mainContent: 'relative px-5 py-3',
    bar: 'flex justify-between items-center',
    trivialize: 'opacity-0 transition-all duration-200 ease-out',
    left: 'flex items-center gap-2',
    right: 'flex items-center gap-2',
  },
}

/** 视频播放器上下文 */
const { controls, playerCore, progressBar } = usePlayerContext()

/** 控制栏引用 */
const controlBarRef = shallowRef<HTMLDivElement | null>(null)

useControlsMouseDetection(controlBarRef)

/** 显示/隐藏控制栏 */
const show = computed(() => {
  return controls.visible.value
})

/** 计算属性 */
const canplay = computed(() => {
  return playerCore.value?.canplay
})
</script>
