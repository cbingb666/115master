<template>
  <div
    ref="containerRef"
    :class="[styles.base]"
    :data-recording="isRecording"
    :data-error="props.error"
    tabindex="0"
    @focus="handleStartRecording"
    @blur="handleStopRecording"
    @keydown.prevent="handleKeyDown"
    @keyup.prevent="handleKeyUp"
  >
    <kbd v-if="displayValue" :class="styles.kbd">{{ displayValue }}</kbd>
    <span v-else-if="isRecording" :class="styles.recordingText">录制中...</span>
    <Icon v-else :class="styles.placeholder" :name="I.PLUS" />
    <Button
      v-if="modelValue && !isRecording"
      color="error"
      size="xs"
      shape="circle"
      :class="styles.remove"
      @click.stop="handleRemove"
    >
      <Icon :name="I.CLOSE" class="size-5" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import type { KeyBindingStr } from '@/components/XPlayer/components/Shortcuts/shortcuts.types'
/**
 * 组件: 快捷键录制
 * @description 用于录制、显示、移除快捷键
 */

import { Button } from '@115master/ui'
import { computed, shallowRef } from 'vue'
import {
  formatKeyDisplay,
  getKeyBindingStringFromEvent,
  isOnlyModifier,
} from '@/components/XPlayer/components/Shortcuts/shortcuts.utils'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const props = withDefaults(defineProps<{
  modelValue?: KeyBindingStr
  error?: boolean
}>(), {
  modelValue: '',
  error: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: KeyBindingStr]
}>()

const styles = clsx({
  base: [
    'group/recorder',
    'relative flex items-center justify-center',
    'h-7 min-w-25 px-2',
    'rounded-full',
    'cursor-pointer select-none',
    'text-xs',
    'bg-base-200',
    'border-base-content/20 border-1',
    'tooltip tooltip-bottom tooltip-error',
    'transition-all',
    'hover:border-base-content/50',
    'data-[recording="true"]:border-primary/70',
    'data-[recording="true"]:ring-3',
    'data-[recording="true"]:ring-primary/30',
    'data-[recording="true"]:bg-primary/90',
    'data-[error="true"]:border-error/60',
    'data-[error="true"]:bg-error/30',
  ],
  kbd: 'text-base-content/90 font-sans font-semibold ',
  placeholder: 'text-base-content/30 size-4',
  recordingText: 'text-base-content font-semibold',
  remove: [
    'absolute -top-2.5 -right-2 p-1',
    'opacity-0',
    'group-hover/recorder:opacity-100',
  ],
})

const ctx = usePlayerContext()
const containerRef = shallowRef<HTMLDivElement>()
const isRecording = shallowRef(false)
const tempKeys = shallowRef<KeyBindingStr>('')

/**
 * 显示值
 */
const displayValue = computed(() => {
  const value = isRecording.value ? tempKeys.value : props.modelValue
  return value ? formatKeyDisplay(value) : ''
})

/**
 * 开始录制
 */
function handleStartRecording() {
  isRecording.value = true
  tempKeys.value = ''
  ctx.shortcuts.recordState.startRecording()
}

/**
 * 停止录制
 */
function handleStopRecording() {
  if (!isRecording.value)
    return
  const value = isOnlyModifier(tempKeys.value) ? '' : tempKeys.value
  tempKeys.value = ''
  isRecording.value = false
  emit('update:modelValue', value)
  ctx.shortcuts.recordState.stopRecording()
}

/**
 * 按键按下事件处理
 * @param event 按键事件
 */
function handleKeyDown(event: KeyboardEvent) {
  if (!isRecording.value)
    return

  if (event.key === 'Escape') {
    containerRef.value?.blur()
    return
  }

  if (event.key === 'Tab') {
    handleStopRecording()
    return
  }

  if (event.repeat)
    return

  tempKeys.value = getKeyBindingStringFromEvent(event)
}

/**
 * 按键抬起事件处理
 */
function handleKeyUp() {
  if (!isRecording.value)
    return
  if (tempKeys.value) {
    emit('update:modelValue', tempKeys.value)
    containerRef.value?.blur()
  }
}

/**
 * 移除快捷键
 */
function handleRemove() {
  emit('update:modelValue', '')
}
</script>
