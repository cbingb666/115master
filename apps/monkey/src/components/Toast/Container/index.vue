<template>
  <slot />
  <div ref="containerRef" :class="styles.container">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      v-bind="toast"
      @close="handleClose(toast)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ToastContainerExpose, ToastContainerProps, ToastContainerSlots } from '@/components/Toast/Container/types'
import type { ToastProps } from '@/components/Toast/Toast/types'
import { computed, ref, withDefaults } from 'vue'
import { useToastContainerProvide } from '@/components/Toast/Container/provide'
import Toast from '@/components/Toast/Toast/index.vue'

const props = withDefaults(defineProps<ToastContainerProps>(), {
  position: 'top-right',
  maxCount: 5,
})

defineSlots<ToastContainerSlots>()

const toasts = ref<ToastProps[]>([])

const containerRef = ref()

function addToast(toast: ToastProps) {
  // 如果超过最大数量，移除最早的toast
  if (props.maxCount > 0 && toasts.value.length >= props.maxCount) {
    const oldestToast = toasts.value[0]
    removeToast(oldestToast.id)
  }

  toasts.value.push(toast)
}

function removeToast(id: string) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function clearToasts() {
  toasts.value = []
}

function updateToast(id: string, updates: Partial<ToastProps>) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value[index] = { ...toasts.value[index], ...updates }
  }
}

function handleClose(toast: ToastProps) {
  toast.closeCallback?.()

  /** 先设置为不可见，然后移除 */
  const index = toasts.value.findIndex(t => t.id === toast.id)
  if (index > -1) {
    toasts.value[index].visible = false
    setTimeout(() => {
      removeToast(toast.id)
    }, 300)
  }
}

const expose = {
  addToast,
  removeToast,
  clearToasts,
  updateToast,
}

defineExpose<ToastContainerExpose>(expose)

useToastContainerProvide(expose)

const styles = computed(() => ({
  container: [
    'fixed',
    'z-[9999]',
    'pointer-events-none',
    'flex flex-col',
    'gap-2',
    'p-4',
    getPositionClass(props.position),
    props.className,
  ].filter(Boolean),
}))

function getPositionClass(position: ToastContainerProps['position']) {
  switch (position) {
    case 'top-left':
      return 'top-0 left-0'
    case 'top-right':
      return 'top-0 right-0'
    case 'bottom-left':
      return 'bottom-0 left-0'
    case 'bottom-right':
      return 'bottom-0 right-0'
    case 'top-center':
      return 'top-0 left-1/2 transform -translate-x-1/2'
    case 'bottom-center':
      return 'bottom-0 left-1/2 transform -translate-x-1/2'
    default:
      return 'top-0 right-0'
  }
}
</script>

<style scoped>
.container :deep(.alert) {
  pointer-events: auto;
}
</style>
