<template>
  <div :class="[styles.row]">
    <span :class="styles.label">
      {{ action.name }}
    </span>
    <div :class="styles.keysWrapper">
      <div :class="styles.keys">
        <template v-for="(keyStr, index) in keyBindings" :key="index">
          <KeyRecorder
            :model-value="keyStr"
            :error="isError(keyStr)"
            @update:model-value="handleUpdate(index, $event)"
          />
        </template>
        <KeyRecorder
          v-if="shouldShowAddRecorder"
          model-value=""
          @update:model-value="handleUpdate(keyBindings.length, $event)"
        />
      </div>
      <span v-if="conflictMessage" :class="styles.conflict">{{ conflictMessage }}</span>
      <span>{{ action.tip }}</span>
    </div>
    <button v-if="isModified" :class="styles.reset" type="button" title="重置" @click="handleReset">
      <Icon :icon="ICONS.ICON_RESET" class="size-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件: 快捷键 Item
 * @description 用于显示快捷键项
 */

import type { Action, ActionKey, KeyBindings, KeyBindingStr } from '@/components/XPlayer/components/Shortcuts/shortcuts.types'
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import {
  hasEmptyKeybindings,
  isMaxKeybindings,
  isSameKeyBindings,
} from '@/components/XPlayer/components/Shortcuts/shortcuts.utils'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { ICONS } from '@/components/XPlayer/index.const'
import { clsx } from '@/utils/clsx'
import KeyRecorder from './KeyRecorder.vue'

const props = defineProps<{
  actionKey: ActionKey
  action: Action
  keyBindings: KeyBindingStr[]
}>()

const emit = defineEmits<{
  'update:key-bindings': [value: KeyBindings ]
  'reset': []
}>()

const styles = clsx({
  row: [
    'group/row',
    'relative',
    'grid grid-cols-[110px_1fr_auto] items-start',
    'gap-4 px-4 py-4',
    'before:[""]',
    'before:absolute',
    'before:inset-x-4',
    'before:inset-y-0',
    'before:border-b-1',
    'before:border-base-content/10',
    'before:pointer-events-none',
    'last:before:border-b-0',
  ],
  label: [
    'text-base-content/90 truncate text-sm font-medium',
    'pt-1',
  ],
  keysWrapper: 'flex flex-col',
  keys: [
    'flex flex-wrap items-center',
    'gap-x-2 gap-y-2',
  ],
  reset: [
    'btn btn-xs btn-circle mt-0.5',
  ],
  conflict: 'text-error mt-1 text-xs font-medium',
})

const { shortcuts } = usePlayerContext()

/** 默认绑定键 */
const defaultKeyBindings = computed(() => {
  const mergedDefaultActionKeyBindings = shortcuts.mergedDefaultActionKeyBindings.value
  return mergedDefaultActionKeyBindings[props.actionKey] || []
})

/** 是否修改过 */
const isModified = computed(() => {
  const curr = props.keyBindings
  const def = defaultKeyBindings.value
  return !isSameKeyBindings(curr, def)
})

/** 冲突消息 */
const conflictMessage = computed(() => {
  const conflicts = shortcuts.conflicts.value
  const actionMap = shortcuts.mergedActionMap.value
  const keyBindings = props.keyBindings

  let hasSelfConflict = false
  const otherConflictNames = new Set<string>()

  keyBindings.forEach((keyBinding) => {
    const list = conflicts.get(keyBinding)
    if (list) {
      list.forEach((item) => {
        if (item.actionKey === props.actionKey) {
          hasSelfConflict = true
        }
        else {
          const action = actionMap[item.actionKey]
          if (action) {
            otherConflictNames.add(action.name)
          }
        }
      })
    }
  })

  const messages: string[] = []

  if (hasSelfConflict) {
    messages.push('快捷键重复')
  }

  if (otherConflictNames.size > 0) {
    const names = Array.from(otherConflictNames).map(n => `「${n}」`).join('、')
    messages.push(`与 ${names} 冲突`)
  }

  return messages.join('，')
})

/** 是否显示添加录制器 */
const shouldShowAddRecorder = computed(() => {
  /** 检查是否超过最大快捷键数量 */
  const overflow = isMaxKeybindings(props.keyBindings, props.action)
  if (overflow) {
    return false
  }
  // 检查是否包含空快捷键
  if (hasEmptyKeybindings(props.keyBindings)) {
    return false
  }

  return true
})

/** 是否有冲突 */
function isError(keyStr: KeyBindingStr) {
  return (shortcuts.conflicts.value.get(keyStr)?.length ?? 0) > 0
}

/** 处理更新 */
function handleUpdate(index: number, value: KeyBindingStr) {
  const arr = [...props.keyBindings]
  if (value) {
    arr[index] = value
  }
  else if (index < props.keyBindings.length) {
    arr.splice(index, 1)
  }
  emit('update:key-bindings', arr)
}

/** 重置 */
function handleReset() {
  emit('reset')
}
</script>
