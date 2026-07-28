<template>
  <Popup
    :visible="visible"
    :class="styles.root"
    variant="panel"
    @update:visible="$emit('update:visible', $event)"
  >
    <div :class="styles.container">
      <!-- 头部 -->
      <div :class="styles.header">
        <h3 :class="styles.title">
          <Icon :name="I.SETTINGS" class="size-6" />
          偏好设置
        </h3>
        <Button
          variant="ghost"
          size="sm"
          shape="circle"
          :class="styles.close"
          @click="$emit('update:visible', false)"
        >
          <Icon :name="I.CLOSE" class="size-6" />
        </Button>
      </div>

      <!-- Tabs -->
      <div :class="styles.tabWrapper">
        <div role="tablist" :class="styles.tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            :class="[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]"
            @click="activeTab = tab.key"
          >
            <Icon :name="tab.icon" class="size-6" />
            <span>{{ tab.name }}</span>
          </button>
        </div>
      </div>

      <!-- 播放标签页 -->
      <PlayerSettingsPlay v-if="activeTab === 'play'" />

      <!-- 快捷键标签页 -->
      <PlayerSettingsShortcuts v-if="activeTab === 'shortcuts'" />
    </div>
  </Popup>
</template>

<script setup lang="ts">
import type { SettingsTab } from '@/components/XPlayer/hooks/useContextMenu'
import type { IconValue } from '@/icons'
import { ref, watch } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'
import Button from '../../../Button/Button'
import PlayerSettingsPlay from './PlayerSettingsPlay.vue'
import PlayerSettingsShortcuts from './PlayerSettingsShortcuts.vue'

interface Tab {
  key: SettingsTab
  name: string
  icon: IconValue
}

const props = withDefaults(
  defineProps<{
    visible?: boolean
    defaultTab?: SettingsTab
  }>(),
  {
    visible: false,
    defaultTab: 'play',
  },
)

defineEmits<{
  'update:visible': [value: boolean]
}>()

const styles = clsx({
  // ===== 弹窗容器 =====
  root: [
    'top-1/2! left-1/2! w-[42rem] max-w-[95vw] -translate-x-1/2! -translate-y-1/2! p-0!',
    '[--group-title-height:calc(var(--spacing)*10)]',
  ],
  container: [
    'relative flex h-[80vh] flex-col overflow-hidden',
    'rounded-2xl',
  ],

  // ===== 头部区域 =====
  header: [
    'sticky top-0 z-1 flex items-center justify-between',
    'bg-base-100/90 px-6 pt-4',
    'rounded-t-2xl',
  ],
  title: [
    'text-base-content flex items-center gap-2.5',
    'text-lg font-bold',
  ],
  close: [
    'transition-colors',
  ],

  // ===== 标签栏 =====
  tabWrapper: [
    'flex items-center justify-around',
    'border-base-content/10 border-b',
    'px-4',
    'rounded-t-2xl',
  ],
  tabs: [
    'tabs tabs-border gap-x-12',
  ],
  tab: [
    'tab tab-ghost tab-sm gap-1',
    'font-medium',
  ],
  tabActive: [
    'tab-active font-bold',
  ],

  // ===== 内容区 =====
  tabContent: [
    '',
  ],
})

/** 标签页列表 */
const tabs: Tab[] = [
  { key: 'play', name: '播放', icon: I.PLAY },
  { key: 'shortcuts', name: '快捷键', icon: I.SHORTCUTS },
]

/** 当前激活的标签页 */
const activeTab = ref<SettingsTab>(props.defaultTab)

/** 监听弹窗打开，重置为默认标签页 */
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      activeTab.value = props.defaultTab
    }
  },
)
</script>
