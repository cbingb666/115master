<template>
  <div
    :id="props.id"
    ref="modalRef"
    :class="styles.modal"
    @click="handleMaskClick"
    @transitionend="handleTransitionEnd"
  >
    <div :class="styles.modalBox" @click.stop>
      <h3 v-if="props.title || slots.title" :class="styles.title">
        <template v-if="slots.title">
          <slot name="title" />
        </template>
        <template v-else>
          {{ props.title }}
        </template>
      </h3>

      <div v-if="hasContent" :class="styles.content">
        <!-- slot -->
        <slot v-if="slots.default" name="default" />
        <!-- component -->
        <component
          :is="props.content"
          v-else-if="isComponentContent"
        />
        <!-- render function -->
        <component
          :is="renderComponent"
          v-else-if="isRenderFunction"
        />
        <!-- string -->
        <template v-else>
          {{ props.content }}
        </template>
      </div>

      <div :class="styles.actions">
        <template v-if="slots.actions">
          <slot name="actions" />
        </template>
        <template v-else>
          <button
            v-if="props.showCancel"
            :class="styles.cancelBtn"
            @click="handleCancel"
          >
            {{ props.cancelText || '取消' }}
          </button>
          <button
            v-if="props.showConfirm"
            :class="styles.confirmBtn"
            @click="handleConfirm"
          >
            {{ props.confirmText || '确认' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModalEmits, ModalProps, ModalSlots } from '@/components/Dialog/Modal/types'
import { useMagicKeys } from '@vueuse/core'
import { computed, defineComponent, isVNode, ref, watch, withDefaults } from 'vue'

const props = withDefaults(defineProps<ModalProps>(), {
  visible: false,
  maskClosable: true,
  showConfirm: true,
  showCancel: false,
})

const emits = defineEmits<ModalEmits>()

const slots = defineSlots<ModalSlots>()

const modalRef = ref<HTMLElement>()

/** 是否是渲染函数 */
const isRenderFunction = computed(() => {
  return typeof props.content === 'function'
})

/** 是否是组件 */
const isComponentContent = computed(() => {
  return props.content && typeof props.content === 'object' && !isVNode(props.content) && typeof props.content !== 'function'
})

/** 是否有内容 */
const hasContent = computed(() => {
  return props.content !== undefined || !!slots.default || isRenderFunction.value
})

/** 创建渲染组件 */
const renderComponent = computed(() => {
  if (!isRenderFunction.value)
    return null

  return defineComponent({
    name: 'DialogRenderContent',
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

/** 处理过渡动画完成事件 */
function handleTransitionEnd(event: TransitionEvent) {
  // 确保是 modal 元素本身的过渡事件
  if (event.target === modalRef.value && props.visible) {
    // 只有在对话框可见且动画完成时才发出 opened 事件
    emits('opened')
  }
}

const styles = computed(() => ({
  modal: [
    'modal',
    'modal-bottom',
    'sm:modal-middle',
    '[scrollbar-gutter:unset]',
    'p-0!',
    props.visible ? 'modal-open' : '',
    props.classNameRoot,
  ].filter(Boolean),
  modalBox: [
    'modal-box',
    'flex flex-col',
    'backdrop-blur-2xl',
    'bg-base-200',
    'p-0!',
    props.className,
  ],
  title: [
    'sticky top-0 z-10',
    'text-lg',
    'font-bold',
    'p-6 pb-4',
    'bg-base-200/5 backdrop-blur-2xl',
    props.classNameTitle,
  ],
  content: [
    'py-2',
    'text-base-content/80',
    'px-6',
    'flex-1',
    props.classNameContent,
  ],
  actions: [
    'modal-action sticky bottom-0',
    'p-6',
    props.classNameActions,
  ],
  cancelBtn: [
    'btn',
    'btn-ghost',
  ],
  confirmBtn: [
    'btn',
    'btn-primary',
  ],
}))

/** 点击蒙层 */
function handleMaskClick(event: MouseEvent) {
  if (props.maskClosable && event.target === event.currentTarget) {
    handleCancel()
  }
}

/** 确认 */
function handleConfirm() {
  emits('confirm')
  emits('close')
}

/** 取消 */
function handleCancel() {
  emits('cancel')
  emits('close')
}

const keys = useMagicKeys()

/** 监听 Esc 键 */
watch(keys.Escape, (value) => {
  if (value) {
    handleCancel()
  }
})
</script>
