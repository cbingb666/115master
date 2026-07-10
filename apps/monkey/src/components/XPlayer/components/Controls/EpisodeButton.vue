<template>
  <button
    :class="[styles.btn.root]"
    :title="tip"
    :disabled="disabled"
    @click="onClick"
  >
    <Icon :class="[styles.btn.icon]" :name="icon" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const props = defineProps<{
  type: 'playPrevious' | 'playNext'
  disabled?: boolean
  onClick: () => void
}>()

const BTN_ICONS = {
  playPrevious: I.PREV,
  playNext: I.NEXT,
} satisfies Record<typeof props.type, string>

const LABELS = {
  playPrevious: '上一集',
  playNext: '下一集',
} satisfies Record<typeof props.type, string>

const styles = clsx({
  btn: controlStyles.btn,
})

const ctx = usePlayerContext()

const icon = computed(() => {
  return BTN_ICONS[props.type]
})

const tip = computed(() => {
  const label = LABELS[props.type]
  const tip = ctx.shortcuts.getShortcutsTip(props.type)
  return `${label}${tip}`
})
</script>
