<template>
  <Popup
    :class="styles.popup"
    :visible="showMessage"
    :x="0"
    :y="0"
    :allow-prevent-controls-close="false"
    @after-leave="onPopupAfterLeave"
  >
    <div
      v-if="displayMessage"
      :class="styles.wrap"
    >
      <!-- 图标区域 -->
      <Icon
        v-if="displayMessage.icon"
        :class="[styles.icon, displayMessage.iconClass]"
        :icon="displayMessage.icon"
      />

      <!-- 内容区域 -->
      <div :class="styles.content">
        <!-- 标题 -->
        <div
          v-if="displayMessage.title"
          :class="styles.title"
        >
          {{ displayMessage.title ?? '' }}
        </div>

        <!-- 进度条 -->
        <progress
          v-if="displayMessage && displayMessage.progress"
          :class="styles.progress"
          :value="displayMessage.progress.value"
          :min="displayMessage.progress.min"
          :max="displayMessage.progress.max"
        />

        <!-- 显示值 -->
        <div
          v-if="displayMessage.value"
          :class="styles.value"
        >
          {{ displayMessage.value }}
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import type { HudMessage } from './types'
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import Popup from '../Popup/index.vue'

const styles = {
  popup: 'left-4! top-4! shadow-xs/90',
  wrap: 'flex items-center gap-2 px-2',
  content: 'flex flex-col gap-1 flex-1 px-1',
  icon: 'size-6',
  title: 'text-sm font-semibold',
  progress: 'progress progress-primary h-1 w-35',
  value: 'text-sm font-semibold text-base-content/70',
}

/** 获取播放器上下文 */
const { hud } = usePlayerContext()

/** 显示状态 */
const showMessage = ref(false)

/** 用于显示的消息内容（延迟清空） */
const displayMessage = ref<HudMessage | null>(null)

/** 当前消息 */
const message = computed(() => {
  return hud?.messages.value[0] || null
})

// 监视消息变化，显示/隐藏弹窗
watch(message, (newMessage) => {
  if (newMessage) {
    // 有新消息，立即显示
    displayMessage.value = newMessage
    showMessage.value = true
  }
  else {
    // 消息被清空，隐藏popup，但保持displayMessage直到动画结束
    showMessage.value = false
  }
})

/** Popup动画结束后清空显示内容 */
function onPopupAfterLeave() {
  displayMessage.value = null
}
</script>
