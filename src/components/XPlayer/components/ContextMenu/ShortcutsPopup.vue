<template>
  <Popup
    :visible="visible"
    :class="styles.root"
    @update:visible="$emit('update:visible', $event)"
  >
    <div :class="styles.container.main">
      <!-- 头部 -->
      <div :class="styles.container.header">
        <div :class="styles.titleContainer">
          <Icon :icon="ICON_SHORTCUTS" :class="styles.titleIcon" />
          <h3 :class="styles.container.headerTitle">
            快捷键
          </h3>
        </div>
        <button :class="styles.closeButton" @click="$emit('update:visible', false)">
          <Icon icon="material-symbols:close-rounded" class="size-4" />
        </button>
      </div>

      <!-- 滚动内容区 -->
      <div :class="styles.container.content">
        <div :class="styles.container.sectionsWrapper">
          <div :class="styles.section.wrapper">
            <div :class="styles.section.content">
              <table :class="styles.table.wrapper">
                <tbody>
                  <tr v-for="shortcut in shortcuts" :key="shortcut.name">
                    <td :class="styles.table.labelCell">
                      {{ shortcut.name }}:
                    </td>
                    <td :class="styles.table.valueCell">
                      <div :class="styles.shortcutKeys">
                        <span
                          v-for="(key, index) in shortcut.keys"
                          :key="index"
                          :class="styles.keyBadge"
                        >
                          {{ formatKey(key) }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import type { HotKeyConfig } from '../../hooks/useHotKey'
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { getHotKeysConfig } from '../../hooks/useHotKey'
import { ICON_SHORTCUTS } from '../../utils/icon'
import Popup from '../Popup/index.vue'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  'update:visible': [value: boolean]
}>()

const styles = {
  // 根元素样式 - 居中显示
  root: 'top-1/2! left-1/2! transform! -translate-x-1/2! -translate-y-1/2! w-lg h-2/3 p-0!',
  // 容器样式
  container: {
    main: 'bg-base-100 h-full rounded-xl flex flex-col',
    header:
      'flex justify-between items-center px-4 py-2 bg-base-200 rounded-t-xl',
    headerTitle: 'text-base font-medium text-base-content',
    content: 'overflow-y-auto flex-1',
    sectionsWrapper: 'space-y-6 text-sm',
  },
  // 章节样式
  section: {
    wrapper: 'shortcuts-section',
    content: 'p-6',
  },
  // 表格样式
  table: {
    wrapper: 'w-full',
    labelCell: 'text-base-content py-1 w-1/3 align-top',
    valueCell: 'text-base-content/60 py-1 text-right',
  },
  // 快捷键样式
  shortcutKeys: 'flex gap-1 justify-end',
  keyBadge: 'kbd kbd-sm rounded',
  // 关闭按钮样式
  closeButton: 'btn btn-ghost btn-circle btn-xs',
  // 标题容器样式
  titleContainer: 'flex items-center space-x-2 gap-2',
  // 标题图标样式
  titleIcon: 'size-6',
}

/** 从useHotKey配置中动态获取快捷键数据 */
const shortcuts = computed(() => {
  const hotKeysConfig = getHotKeysConfig()
  return Object.values(hotKeysConfig).map((config: HotKeyConfig) => ({
    name: config.name,
    keys: config.keys,
  }))
})

/** 格式化按键显示 */
function formatKey(key: string) {
  const keyMap: Record<string, string> = {
    ' ': 'Space',
  }

  return keyMap[key] || key
}
</script>
