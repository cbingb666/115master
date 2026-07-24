<template>
  <Button
    variant="ghost"
    shape="circle"
    :title="tip"
    :disabled="disabled"
    @click="onClick"
  >
    <Icon :class="controlStyles.btn.icon" :name="icon" />
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import Button from '../../../Button/Button'

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
