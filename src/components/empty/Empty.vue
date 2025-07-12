<template>
  <div :class="styles.container">
    <div v-if="props.showImage" :class="styles.imageWrapper">
      <template v-if="props.image">
        <img
          :src="props.image"
          :class="styles.customImage"
        >
      </template>
      <template v-else>
        <Icon :icon="iconName" :class="styles.defaultIcon" />
      </template>
    </div>
    <div :class="styles.description">
      {{ props.description }}
    </div>
    <div v-if="!!$slots.default" :class="styles.footer">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { ICON_EMPTY } from '../../icons'

interface Props {
  /** 描述文本 */
  description?: string
  /** 图片地址 */
  image?: string
  /** 图片大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** 是否显示默认图片 */
  showImage?: boolean
  /** 图标名称 */
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  image: '',
  size: 'md',
  showImage: true,
  icon: ICON_EMPTY,
})

/** 插槽 */
defineSlots<{
  /** 默认插槽 */
  default: () => void
}>()

const iconName = computed(() => props.icon)

/** 样式常量定义 */
const styles = computed(() => ({
  // 容器样式
  container: [
    'flex flex-col items-center justify-center text-base-content/60',
    'animate-in fade-in duration-300',
    // 根据尺寸调整容器内边距
    {
      'xs': 'p-2',
      'sm': 'p-3',
      'md': 'p-4',
      'lg': 'p-6',
      'xl': 'p-8',
      '2xl': 'p-10',
    }[props.size],
  ],
  // 图片容器样式
  imageWrapper: [
    // 根据尺寸调整与描述文本的间距
    {
      'xs': 'mb-1',
      'sm': 'mb-2',
      'md': 'mb-3',
      'lg': 'mb-4',
      'xl': 'mb-5',
      '2xl': 'mb-6',
    }[props.size],
  ],
  // 自定义图片样式
  customImage: [
    'max-w-full h-auto align-middle opacity-60',
    // 根据尺寸设置图片大小
    {
      'xs': 'w-8 h-8',
      'sm': 'w-12 h-12',
      'md': 'w-16 h-16',
      'lg': 'w-20 h-20',
      'xl': 'w-24 h-24',
      '2xl': 'w-32 h-32',
    }[props.size],
  ],
  // 默认图标样式
  defaultIcon: [
    'text-base-content/30',
    // 根据尺寸调整图标大小
    {
      'xs': 'text-2xl',
      'sm': 'text-3xl',
      'md': 'text-4xl',
      'lg': 'text-5xl',
      'xl': 'text-6xl',
      '2xl': 'text-8xl',
    }[props.size],
  ],
  // 描述文本样式
  description: [
    'text-center font-medium leading-relaxed',
    // 根据尺寸调整文字大小
    {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-sm',
      'lg': 'text-base',
      'xl': 'text-lg',
      '2xl': 'text-xl',
    }[props.size],
  ],
  // 底部内容样式
  footer: [
    // 根据尺寸调整与描述文本的间距
    {
      'xs': 'mt-1',
      'sm': 'mt-2',
      'md': 'mt-3',
      'lg': 'mt-4',
      'xl': 'mt-5',
      '2xl': 'mt-6',
    }[props.size],
  ],
}))
</script>
