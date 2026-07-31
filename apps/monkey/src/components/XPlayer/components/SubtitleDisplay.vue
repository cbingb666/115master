<template>
  <div :class="styles.root">
    <div :class="styles.itemContent">
      <!-- 第一行：序号 + 字幕名称 -->
      <div :class="styles.firstLine">
        <span :class="styles.label">{{ label }}</span>
      </div>
      <!-- 第二行：格式 + 来源 + 操作按钮 -->
      <div :class="styles.secondLine">
        <span v-if="subtitleIndex !== null" :class="[styles.badge, tone]">
          No.{{ subtitleIndex }}
        </span>
        <span v-if="format" :class="[styles.badge, tone]">
          {{ format.toUpperCase() }}
        </span>
        <span v-if="source" :class="[styles.badge, tone]">
          {{ source }}
        </span>
        <div v-if="showActions" :class="styles.actions">
          <Button
            variant="ghost"
            size="xs"
            shape="circle"
            :class="[styles.action, active && 'text-primary-content']"
            :title="`查看 ${label}`"
            @click="emit('view')"
          >
            <Icon :class="styles.actionIcon" :name="I.VIEW" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            shape="circle"
            :class="[styles.action, active && 'text-primary-content']"
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
import { computed } from 'vue'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

interface Props {
  label: string
  format?: string
  source?: string
  subtitleIndex: number | null
  total: number
  showActions?: boolean
  /** 是否为菜单选中项（primary 底色，需切换前景色调） */
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
  active: false,
})

const emit = defineEmits<{
  view: []
  download: []
}>()

/** badge 色调：选中态在 primary 底色上使用 primary-content 前景 */
const tone = computed(() => props.active
  ? 'bg-primary-content/20 text-primary-content/80'
  : 'bg-base-content/10 text-base-content/60')

const styles = clsx({
  root: 'flex w-full items-center gap-2',
  itemContent: 'flex min-w-0 flex-1 flex-col gap-1.5',
  firstLine: 'flex items-center gap-2',
  secondLine: 'flex items-center gap-1.5',
  label: 'line-clamp-2 text-sm leading-snug font-medium break-all',
  badge: 'rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
  actions: 'ml-auto flex items-center gap-1',
  action: 'flex-shrink-0',
  actionIcon: 'size-4',
})
</script>
