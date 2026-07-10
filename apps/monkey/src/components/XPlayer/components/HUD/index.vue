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
          <component :is="displayMessage.title" v-if="isVNode(displayMessage.title)" />
          <template v-else>
            {{ displayMessage.title ?? '' }}
          </template>
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
          <component :is="displayMessage.value" v-if="isVNode(displayMessage.value)" />
          <template v-else>
            {{ displayMessage.value }}
          </template>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import type { HudMessage } from './types'
import { Icon } from '@iconify/vue'
import { computed, isVNode, ref, watch } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  popup: 'bg-base-100/50! app-shadow!  top-6! left-6! backdrop-blur-sm! backdrop-brightness-100! backdrop-saturate-120!',
  wrap: 'flex items-center gap-2 px-4 py-2',
  content: 'flex flex-1 flex-col gap-1 px-1',
  icon: 'size-6',
  title: 'text-sm font-semibold',
  progress: 'progress progress-primary h-1 w-35',
  value: 'text-base-content/70 text-sm font-semibold',
})

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
