<template>
  <Popup
    :visible="visible"
    :class="styles.root"
    variant="panel"
    @update:visible="$emit('update:visible', $event)"
  >
    <div :class="styles.container.main">
      <!-- 头部 -->
      <div :class="styles.container.header">
        <div :class="styles.titleContainer">
          <Icon :name="I.ABOUT" :class="styles.titleIcon" />
          <h3 :class="styles.container.headerTitle">
            关于
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          shape="circle"
          :class="styles.closeButton"
          @click="$emit('update:visible', false)"
        >
          <Icon :name="I.CLOSE" class="size-6" />
        </Button>
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
import { Button } from '@115master/ui'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  'update:visible': [value: boolean]
}>()

const styles = clsx({
  // 根元素样式 - 居中显示，自适应高度
  root: 'top-1/2! left-1/2! max-h-2/3 w-lg -translate-x-1/2! -translate-y-1/2! transform! p-0!',
  // 容器样式
  container: {
    main: 'flex flex-col rounded-xl',
    header:
      'flex items-center justify-between rounded-t-xl px-4 py-4',
    headerTitle: 'text-base-content text-base font-medium',
    content: 'max-h-96 overflow-y-auto',
    sectionsWrapper: 'space-y-6 text-sm',
  },
  // 章节样式
  section: {
    wrapper: 'about-section',
    content: 'px-6 py-4',
  },
  // 关闭按钮样式
  closeButton: '',
  // 默认内容样式
  defaultContent: 'text-base-content/60 py-8 text-center',
  // 标题容器样式
  titleContainer: 'flex items-center gap-2 space-x-2',
  // 标题图标样式
  titleIcon: 'size-6',
})
</script>
