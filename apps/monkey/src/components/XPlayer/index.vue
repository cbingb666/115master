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
    <StatusFeedback
      v-if="playerCore?.loadError"
      :class="styles.error"
      status="error"
      v-bind="errorFeedback(playerCore.loadError)"
      close-label="忽略错误"
      :on-close="closeError"
    />

    <!-- 加载动画 -->
    <Loading v-else-if="playerCore?.isLoading" />

    <!-- 调试面板 -->
    <Statistics />

    <!-- 右键菜单 -->
    <ActionMenu
      :open="contextMenu.visible.value"
      :position="contextMenu.position.value"
      :groups="contextMenu.groups"
      material="overlay"
      aria-label="播放器操作"
      @update:open="(visible: boolean) => contextMenu.visible.value = visible"
    />

    <PlayerSettingsPopup
      :visible="contextMenu.showSettings.value"
      :default-tab="contextMenu.defaultSettingsTab.value"
      @update:visible="(visible: boolean) => contextMenu.showSettings.value = visible"
    />

    <!-- 恢复容器 -->
    <div
      v-if="source.isInterrupt.value"
      :class="styles.resumeContainer"
    >
      <Button variant="solid" :class="styles.resumeButton" @click="source.resumeSource">
        恢复播放
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerContext } from './hooks/usePlayerProvide'
import type { XPlayerEmit, XPlayerProps } from './types'
import { ActionMenu, Button, StatusFeedback } from '@115master/ui'
import { shallowRef, watch, watchEffect } from 'vue'
import { clsx } from '@/utils/clsx'
import { errorFeedback } from '@/utils/errorFeedback'
import ControlsBar from './components/Controls/ControlBar.vue'
import ControlsHeader from './components/Controls/ControlHeader.vue'
import ControlsMask from './components/Controls/ControlMask.vue'
import Controls from './components/Controls/index.vue'
import SubtitleInfo from './components/Controls/SubtitleInfo.vue'
import HUD from './components/HUD/index.vue'
import Loading from './components/Loading/index.vue'
import PlayAnimation from './components/PlayAnimation/index.vue'
import PlayerSettingsPopup from './components/Settings/PlayerSettingsPopup.vue'
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
}>()

const styles = clsx({
  root: 'relative bg-black',
  fullscreen: 'w-100vw h-100vh',
  container: 'relative h-full w-full overflow-hidden',
  videoPlayer: 'flex h-full w-full items-center justify-center',
  error:
    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform',
  resumeContainer:
    'ui-z-cover absolute inset-0 flex items-center justify-center bg-black/90',
  resumeButton: '',
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
  contextMenu,
} = ctx

function closeError() {
  if (playerCore.value)
    playerCore.value.loadError = undefined
}

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
