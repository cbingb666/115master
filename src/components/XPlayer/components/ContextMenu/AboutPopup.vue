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
          <Icon :icon="ICON_ABOUT" :class="styles.titleIcon" />
          <h3 :class="styles.container.headerTitle">
            关于
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
              <slot name="content">
                <!-- 默认内容，如果没有传入slot -->
                <div :class="styles.defaultContent">
                  <p>请通过 slot 传入关于内容</p>
                </div>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ICON_ABOUT } from '../../utils/icon'
import Popup from '../Popup/index.vue'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  'update:visible': [value: boolean]
}>()

const styles = {
  // 根元素样式 - 居中显示，自适应高度
  root: 'top-1/2! left-1/2! transform! -translate-x-1/2! -translate-y-1/2! w-lg max-h-2/3 p-0!',
  // 容器样式
  container: {
    main: 'bg-base-100 rounded-xl flex flex-col',
    header:
      'flex justify-between items-center px-4 py-2 bg-base-200 rounded-t-xl',
    headerTitle: 'text-base font-medium text-base-content',
    content: 'overflow-y-auto max-h-96',
    sectionsWrapper: 'space-y-6 text-sm',
  },
  // 章节样式
  section: {
    wrapper: 'about-section',
    content: 'px-6 py-4',
  },
  // 关闭按钮样式
  closeButton: 'btn btn-ghost btn-circle btn-xs',
  // 默认内容样式
  defaultContent: 'text-center text-base-content/60 py-8',
  // 标题容器样式
  titleContainer: 'flex items-center space-x-2 gap-2',
  // 标题图标样式
  titleIcon: 'size-6',
}
</script>
