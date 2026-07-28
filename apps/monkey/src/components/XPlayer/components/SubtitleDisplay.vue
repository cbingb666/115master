<template>
  <div :class="styles.root">
    <div :class="styles.itemContent">
      <!-- 第一行：序号 + 字幕名称 -->
      <div :class="styles.firstLine">
        <span :class="styles.label">{{ label }}</span>
      </div>
      <!-- 第二行：格式 + 来源 + 操作按钮 -->
      <div :class="styles.secondLine">
        <span v-if="subtitleIndex !== null" :class="styles.badge">
          No.{{ subtitleIndex }}
        </span>
        <span v-if="format" :class="styles.badge">
          {{ format.toUpperCase() }}
        </span>
        <span v-if="source" :class="styles.badge">
          {{ source }}
        </span>
        <div v-if="showActions" :class="styles.actions">
          <Button
            variant="ghost"
            size="xs"
            shape="circle"
            :class="styles.action"
            :title="`查看 ${label}`"
            @click="emit('view')"
          >
            <Icon :class="styles.actionIcon" :name="I.VIEW" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            shape="circle"
            :class="styles.action"
            :title="`下载 ${label}`"
            @click="emit('download')"
          >
            <Icon :class="styles.actionIcon" :name="I.DOWNLOAD" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@115master/ui'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

interface Props {
  label: string
  format?: string
  source?: string
  subtitleIndex: number | null
  total: number
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  showActions: false,
})

const emit = defineEmits<{
  view: []
  download: []
}>()

const styles = clsx({
  root: 'text-base-content flex w-full items-center gap-2',
  itemContent: 'flex min-w-0 flex-1 flex-col gap-1.5',
  firstLine: 'flex items-center gap-2',
  secondLine: 'flex items-center gap-1.5',
  label: 'line-clamp-2 text-sm leading-snug font-medium break-all',
  badge: 'bg-base-content/10 text-base-content/60 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
  actions: 'ml-auto flex items-center gap-1',
  action: 'flex-shrink-0',
  actionIcon: 'size-4',
})
</script>
