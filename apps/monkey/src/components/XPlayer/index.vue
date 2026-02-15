<template>
  <div
    ref="rootRef"
    :class="[
      styles.root,
      { [styles.fullscreen]: fullscreen.isFullscreen },
    ]"
  >
    <!-- SVG滤镜定义，使用v-html渲染 -->
    <div v-html="videoEnhance.renderFilter.value" />

    <!-- 视频容器 -->
    <div
      ref="playerElementRef"
      :class="styles.videoPlayer"
      :style="[
        transform.transformStyle.value,
        videoEnhance.getFilterStyle.value,
      ]"
    />

    <!-- 播放/暂停动画 -->
    <PlayAnimation />

    <!-- 字幕 -->
    <Subtitle />

    <!-- 视频控制栏 -->
    <Controls>
      <ControlsHeader>
        <template #left>
          <slot name="headerLeft" v-bind="{ ctx }" />
        </template>
        <template #right>
          <slot name="headerRight" v-bind="{ ctx }" />
        </template>
      </ControlsHeader>
      <SubtitleInfo />
      <ControlsMask />
      <ControlsBar />
    </Controls>

    <!-- 状态HUD显示 -->
    <HUD />

    <!-- 错误提示 -->
    <LoadingError
      v-if="playerCore?.loadError"
      :class="styles.error"
      :message="playerCore.loadError"
      :closable="true"
      close-text="忽略错误"
      @close="playerCore.loadError = undefined"
    />

    <!-- 加载动画 -->
    <Loading v-else-if="playerCore?.isLoading" />

    <!-- 调试面板 -->
    <Statistics />

    <!-- 右键菜单 -->
    <ContextMenu>
      <template #aboutContent>
        <slot name="aboutContent" />
      </template>
    </ContextMenu>

    <!-- 恢复容器 -->
    <div
      v-if="source.isInterrupt.value"
      :class="styles.resumeContainer"
    >
      <button :class="styles.resumeButton" @click="source.resumeSource">
        恢复播放
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerContext } from './hooks/usePlayerProvide'
import type { XPlayerEmit, XPlayerProps } from './types'
import { shallowRef, watch, watchEffect } from 'vue'
import { LoadingError } from '@/components'
import { clsx } from '@/utils/clsx'
import ContextMenu from './components/ContextMenu/index.vue'
import ControlsBar from './components/Controls/ControlBar.vue'
import ControlsHeader from './components/Controls/ControlHeader.vue'
import ControlsMask from './components/Controls/ControlMask.vue'
import Controls from './components/Controls/index.vue'
import SubtitleInfo from './components/Controls/SubtitleInfo.vue'
import HUD from './components/HUD/index.vue'
import Loading from './components/Loading/index.vue'
import PlayAnimation from './components/PlayAnimation/index.vue'
import { FAST_JUMP_OFFSET, HIGH_FAST_JUMP_OFFSET } from './components/Shortcuts/shortcuts.const'
import Statistics from './components/Statistics/index.vue'
import Subtitle from './components/Subtitle/index.vue'
import { usePlayerProvide } from './hooks/usePlayerProvide'
import { usePortalProvider } from './hooks/usePortal'

/** 属性 */
const props = withDefaults(defineProps<XPlayerProps>(), {
  onThumbnailRequest: undefined,
  onSubtitleChange: undefined,
  hlsConfig: () => ({}),
  avPlayerConfig: () => ({}),
  quality: 0,
  longPressPlaybackRate: 15,
  seekSeconds: FAST_JUMP_OFFSET,
  highSpeedSeekSeconds: HIGH_FAST_JUMP_OFFSET,
  percentageSeek: 10,
})

/** 事件 */
const emit = defineEmits<XPlayerEmit>()

/** 插槽 */
defineSlots<{
  /** 头部左侧插槽 */
  headerLeft: (props: { ctx: PlayerContext }) => void
  /** 头部右侧插槽 */
  headerRight: (props: { ctx: PlayerContext }) => void
  /** 关于内容插槽 */
  aboutContent: () => void
}>()

const styles = clsx({
  root: 'relative bg-black',
  fullscreen: 'w-100vw h-100vh',
  container: 'relative h-full w-full overflow-hidden',
  videoPlayer: 'flex h-full w-full items-center justify-center',
  error:
    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform',
  resumeContainer:
    'absolute inset-0 z-2 flex items-center justify-center bg-black/90',
  resumeButton: 'btn',
})

/** 根元素 */
const rootRef = shallowRef<HTMLElement | null>(null)
/** 原生视频元素 */
const playerElementRef = shallowRef<HTMLDivElement | null>(null)
/** 弹出层上下文 */
const portalContext = usePortalProvider()

// 使用 rootRef 作为弹出层容器
watchEffect(() => {
  portalContext.container.value = rootRef.value ?? undefined
})

/** 视频播放器上下文 */
const ctx = usePlayerProvide(
  {
    rootRef,
    playerElementRef,
  },
  props,
  emit,
)

const {
  fullscreen,
  source,
  transform,
  videoEnhance,
  playerCore,
  controls,
} = ctx

// 监听控制栏可见性，直接设置光标样式
watch(
  () => controls.visible.value,
  (visible) => {
    if (rootRef.value) {
      rootRef.value.style.cursor = visible ? 'auto' : 'none'
    }
  },
  { immediate: true },
)

// 暴露方法
defineExpose({
  togglePlay: playerCore.value?.togglePlay,
  interruptSource: source.interruptSource,
  seekTo: playerCore.value?.seek,
})
</script>
