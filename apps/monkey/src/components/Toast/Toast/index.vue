<template>
  <div :class="styles.toast" @click="handleToastClick">
    <div :class="styles.icon">
      <slot v-if="slots.icon" name="icon" />
      <template v-else>
        <Icon
          v-if="props.type === 'success'"
          :icon="ICON_TOAST_SUCCESS"
          :class="styles.iconSize"
        />
        <Icon
          v-else-if="props.type === 'error'"
          :icon="ICON_TOAST_ERROR"
          :class="styles.iconSize"
        />
        <Icon
          v-else-if="props.type === 'warning'"
          :icon="ICON_TOAST_WARNING"
          :class="styles.iconSize"
        />
        <Icon
          v-else-if="props.type === 'info'"
          :icon="ICON_TOAST_INFO"
          :class="styles.iconSize"
        />
      </template>
    </div>

    <div :class="styles.content">
      <div v-if="props.title || slots.title" :class="styles.title">
        <slot v-if="slots.title" name="title" />
        <template v-else>
          {{ props.title }}
        </template>
      </div>

      <div :class="styles.message">
        <slot v-if="slots.default" name="default" />
        <component
          :is="props.content"
          v-else-if="isComponentContent"
        />
        <component
          :is="renderComponent"
          v-else-if="isRenderFunction"
        />
        <template v-else>
          {{ props.content }}
        </template>
      </div>
    </div>

    <div v-if="props.closable" :class="styles.closeButton" @click.stop="handleClose">
      <Icon
        :icon="ICON_TOAST_CLOSE"
        :class="styles.closeIconSize"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToastEmits, ToastProps, ToastSlots } from '@/components/Toast/Toast/types'
import { Icon } from '@iconify/vue'
import { computed, defineComponent, isVNode, onMounted, onUnmounted, ref, withDefaults } from 'vue'
import {
  ICON_TOAST_CLOSE,
  ICON_TOAST_ERROR,
  ICON_TOAST_INFO,
  ICON_TOAST_SUCCESS,
  ICON_TOAST_WARNING,
} from '@/icons'

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000,
  closable: true,
  visible: true,
})

const emits = defineEmits<ToastEmits>()

const slots = defineSlots<ToastSlots>()

const timer = ref<NodeJS.Timeout | null>(null)

/** 是否是渲染函数 */
const isRenderFunction = computed(() => {
  return typeof props.content === 'function'
})

/** 是否是组件 */
const isComponentContent = computed(() => {
  return props.content && typeof props.content === 'object' && !isVNode(props.content) && typeof props.content !== 'function'
})

/** 创建渲染组件 */
const renderComponent = computed(() => {
  if (!isRenderFunction.value)
    return null

  return defineComponent({
    name: 'ToastRenderContent',
    render() {
      try {
        const renderFn = props.content as () => any
        return renderFn()
      }
      catch (error) {
        console.error('Error rendering function content:', error)
        return '渲染错误'
      }
    },
  })
})

const styles = computed(() => ({
  toast: [
    'alert',
    'shadow-lg',
    'mb-3',
    'animate-slideInRight',
    'transition-all duration-300',
    'flex items-center',
    'min-w-80',
    'max-w-md',
    'cursor-pointer',
    'rounded-xl',
    'px-4 py-3',
    'backdrop-blur-sm',
    'relative',
    'z-50',
    'pointer-events-auto',
    getTypeClass(props.type),
    props.className,
  ].filter(Boolean),
  icon: [
    'shrink-0',
    'flex-none',
    'size-7',
    'mr-3',
  ],
  iconSize: [
    'size-7',
  ],
  content: [
    'flex-1',
    'min-w-0',
  ],
  title: [
    'font-semibold',
    'text-base',
    'mb-1',
    'leading-tight',
  ],
  message: [
    'text-sm',
    'break-words',
    'leading-relaxed',
    'opacity-90',
  ],
  closeButton: [
    'shrink-0',
    'flex-none',
    'ml-3',
    'cursor-pointer',
    'hover:bg-black/10',
    'rounded-lg',
    'transition-all duration-200',
    'hover:scale-110',
    'relative',
    'z-10',
  ],
  closeIconSize: [
    'size-8',
  ],
}))

function getTypeClass(type: ToastProps['type']) {
  switch (type) {
    case 'success':
      return 'alert-success bg-success/80'
    case 'error':
      return 'alert-error bg-error/80'
    case 'warning':
      return 'alert-warning bg-warning/80'
    case 'info':
    default:
      return 'alert-info bg-info/80'
  }
}

function handleClose() {
  emits('close', props.id)
}

function handleToastClick(event: MouseEvent) {
  // 如果点击的是关闭按钮，不处理
  if ((event.target as HTMLElement).closest('[data-close]')) {
    return
  }
  // 其他点击事件可以在这里处理
  // 现在暂时不做任何处理
  console.debug('Toast clicked:', event)
}

function startTimer() {
  if (props.duration > 0) {
    timer.value = setTimeout(() => {
      handleClose()
    }, props.duration)
  }
}

function clearTimer() {
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = null
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  clearTimer()
})
</script>

<style scoped>
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slideInRight {
  animation: slideInRight 0.3s ease-out;
}
</style>
