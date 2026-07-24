<template>
  <transition
    enter-active-class="transition-all duration-300 ease-[var(--ease-in-cubic)]"
    leave-active-class="transition-all duration-300 ease-[var(--ease-in-cubic)]"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      ref="controlBarRef"
      :class="styles.controlBar.main"
    >
      <div :class="styles.controlBar.bg" />
      <!-- 视频控制栏 -->
      <div
        :ref="controls.mainRef"
        :class="[styles.controlBar.mainContent]"
      >
        <div :class="styles.controlBar.subBar">
          <div :class="styles.controlBar.subBarLeft" />
          <div :class="styles.controlBar.subBarRight" />
        </div>
        <div
          :class="[styles.controlBar.mainBar]"
        >
          <div :class="styles.controlBar.mainBarLeft">
            <PlayerControlSurface>
              <!-- 上一集按钮 -->
              <EpisodeButton
                type="playPrevious"
                :disabled="!rootProps.hasPrevious"
                :on-click="handlePlayPrevious"
              />
              <!-- 播放按钮 -->
              <PlayButton />
              <!-- 下一集按钮 -->
              <EpisodeButton
                type="playNext"
                :disabled="!rootProps.hasNext"
                :on-click="handlePlayNext"
              />
            </PlayerControlSurface>
            <PlayerControlSurface>
              <!-- 音量控制 -->
              <VolumeControl />
            </PlayerControlSurface>
            <PlayerControlSurface class="hidden lg:flex">
              <TimeDisplay />
            </PlayerControlSurface>
          </div>
          <div :class="styles.controlBar.mainBarCenter">
            <!-- 进度条 -->
            <ProgressBar />
          </div>
          <div :class="styles.controlBar.mainBarRight">
            <PlayerControlSurface>
              <ExpandableControlGroup>
                <template #expanded>
                  <!-- 画面变换 -->
                  <TransformButton />
                  <!-- 视频色彩 -->
                  <VideoEnhanceSettings />
                  <!-- 音频轨道 -->
                  <AudioTrackButton />
                </template>
                <!-- 字幕按钮 -->
                <SubtitleButton />
              </ExpandableControlGroup>
            </PlayerControlSurface>

            <PlayerControlSurface>
              <!-- 倍速控制 -->
              <PlaybackRateButton />
            </PlayerControlSurface>

            <PlayerControlSurface>
              <!-- 画质控制 -->
              <QualityButton />
            </PlayerControlSurface>

            <PlayerControlSurface>
              <!-- 画中画 -->
              <PipButton />
              <!-- 全屏控制 -->
              <FullscreenButton />
            </PlayerControlSurface>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useControlsMouseDetection } from '@/components/XPlayer/hooks/useControlsMouseDetection'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'
import AudioTrackButton from './AudioTrackButton.vue'
import EpisodeButton from './EpisodeButton.vue'
import ExpandableControlGroup from './ExpandableControlGroup'
import FullscreenButton from './FullscreenButton.vue'
import PipButton from './PipButton.vue'
import PlaybackRateButton from './PlaybackRateButton.vue'
import PlayButton from './PlayButton.vue'
import PlayerControlSurface from './PlayerControlSurface'
import ProgressBar from './ProgressBar.vue'
import QualityButton from './QualityButton.vue'
import SubtitleButton from './SubtitleButton.vue'
import TimeDisplay from './TimeDisplay.vue'
import TransformButton from './TransformButton.vue'
import VideoEnhanceSettings from './VideoEnhanceSettings.vue'
import VolumeControl from './VolumeControl.vue'

/** 样式抽象 */
const styles = clsx({
  controlBar: {
    main: [
      'pointer-events-auto relative',
      'transform-gpu',
    ],
    bg: [
      'absolute inset-0 top-[-200%]',
      'bg-[linear-gradient(to_top,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.32)_22%,rgba(0,0,0,0.26)_32%,rgba(0,0,0,0.20)_42%,rgba(0,0,0,0.14)_52%,rgba(0,0,0,0.08)_62%,rgba(0,0,0,0.03)_72%,rgba(0,0,0,0)_100%)]',
      'pointer-events-none',
    ],
    mainContent: 'relative flex flex-col gap-y-2 px-6 pb-6',
    mainBar: 'flex items-center gap-2',
    mainBarLeft: 'flex items-center gap-2',
    mainBarCenter: 'flex-1 px-6',
    mainBarRight: 'flex items-center gap-2',
    subBar: 'flex items-center justify-between',
    subBarLeft: 'flex items-center gap-2',
    subBarRight: 'flex items-center gap-2',
  },
})

/** 视频播放器上下文 */
const ctx = usePlayerContext()

const { controls, rootProps, rootEmit } = ctx

/** 控制栏引用 */
const controlBarRef = shallowRef<HTMLDivElement | null>(null)

useControlsMouseDetection(controlBarRef)

/** 显示/隐藏控制栏 */
const show = computed(() => {
  return controls.visible.value
})

/** 播放上一集 */
function handlePlayPrevious() {
  rootEmit('playPrevious', ctx)
}

/** 播放下一集 */
function handlePlayNext() {
  rootEmit('playNext', ctx)
}
</script>
