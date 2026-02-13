<template>
  <Teleport :to="portalContainer" :disabled="!portalContainer">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      @enter="onEnter"
      @after-leave="onAfterLeave"
    >
      <div
        v-show="visibleModel"
        ref="popupRef"
        :class="styles.popup"
        :data-mild="props.mild"
        :style="style"
        v-bind="$attrs"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { BaseTransitionProps } from 'vue'
import { onClickOutside, useElementBounding, useVModel } from '@vueuse/core'
import {

  computed,
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
} from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { usePortal } from '@/components/XPlayer/hooks/usePortal'
import { clsx } from '@/utils/clsx'
import { isInContainsTrigger, triggerSet } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<Props>(), {
  x: 0,
  y: 0,
  outsideStopPropagation: false,
  allowPreventControlsClose: true,
  mild: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'after-leave': []
}>()

const styles = clsx({
  popup:
    [
      'relative',
      'x-popup',
      'bg-base-100/75',
      'backdrop-blur-sm backdrop-saturate-180',
      'rounded-3xl',
      'overflow-hidden',
      'app-glass-border',
      'data-[mild=true]:bg-base-100/90',
      'data-[mild=true]:backdrop-blur-3xl',
    ],
})

interface Props {
  /** 是否显示 */
  visible: boolean
  /** 水平位置 */
  x?: number
  /** 垂直位置 */
  y?: number
  /** 触发元素 */
  trigger?: HTMLElement
  /** 位置 */
  placement?: 'top' | 'bottom'
  /** 偏移量 */
  offset?: number
  /** 点击外部是否阻止冒泡 */
  outsideStopPropagation?: boolean
  /** 允许阻止控制栏关闭 */
  allowPreventControlsClose?: boolean
  /** 是否温和 */
  mild?: boolean
}

const { container } = usePortal()
const { popupManager } = usePlayerContext()

/** 是否显示 */
const visibleModel = useVModel(props, 'visible', emit)
/** 弹出层元素 */
const popupRef = shallowRef<HTMLElement>()
/** 位置 */
const position = shallowRef({
  x: 0,
  y: 0,
})
/** 弹出层容器 */
const portalContainer = computed(() => container.value || 'body')
/** 播放器容器元素 */
const portalContainerEl = computed(() => {
  if (typeof portalContainer.value === 'string') {
    return document.querySelector(portalContainer.value) ?? undefined
  }
  return portalContainer.value
})
/** 样式 */
const style = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  position: container.value ? ('absolute' as const) : ('fixed' as const),
}))

const portalContainerBounding = useElementBounding(portalContainerEl)

/** 生成唯一的popup ID */
const popupId = `popup-${Math.random().toString(36).substr(2, 9)}`

// 监听popup显示状态变化，通知popup管理器
watch(visibleModel, (newVisible) => {
  popupManager?.setPopupVisible(popupId, newVisible)
})

onMounted(() => {
  popupManager?.registerPopup(popupId, {
    visible: visibleModel.value,
    trigger: props.trigger,
    container: popupRef.value!,
    portalContainer: portalContainerEl.value!,
    allowPreventControlsClose: props.allowPreventControlsClose,
  })
})
// 组件卸载时确保清理popup状态
onUnmounted(() => {
  popupManager?.unregisterPopup(popupId)
})

/**
 * 获取位置
 * @param trigger 触发元素
 * @param popup 弹出层元素
 * @param portal 入口容器元素
 */
function getPosition(trigger?: HTMLElement, popup?: HTMLElement, portal?: HTMLElement) {
  if (!trigger) {
    return {
      x: props.x,
      y: props.y,
    }
  }
  if (!popup || !portal)
    return { x: 0, y: 0 }

  /** 获取触发元素和菜单的尺寸 */
  const triggerRect = trigger.getBoundingClientRect()
  const popupRect = popup.getBoundingClientRect()

  /** 获取播放器容器 */
  const portalRect = portal.getBoundingClientRect()

  /** 计算触发元素相对于播放器的位置 */
  const triggerLeft = triggerRect.left - portalRect.left
  const triggerWidth = triggerRect.width
  const triggerTop = triggerRect.top - portalRect.top
  const triggerBottom = triggerRect.bottom - portalRect.top

  /** 计算可用空间 */
  const spaceBelow = portalRect.height - triggerBottom
  const spaceAbove = triggerTop

  /** 默认偏移量 */
  const offset = props.offset ?? 8

  /** 确定垂直位置 */
  let y: number
  if (
    props.placement === 'top'
    || (props.placement !== 'bottom'
      && spaceBelow < popupRect.height
      && spaceAbove >= popupRect.height)
  ) {
    y = triggerTop - popupRect.height - offset
  }
  else {
    y = triggerBottom + offset
  }

  /** 计算水平居中位置 */
  let x = triggerLeft + triggerWidth / 2 - popupRect.width / 2

  // 确保菜单不会超出播放器左侧或右侧边界
  x = Math.max(16, x) // 左侧边界保留16px间距
  x = Math.min(x, portalRect.width - popupRect.width - 16) // 右侧边界保留16px间距

  return { x, y }
}

/**
 * 更新位置
 */
function updatePosition() {
  const positionNew = getPosition(
    props.trigger,
    popupRef.value,
    portalContainerEl.value,
  )
  position.value = positionNew
}

/**
 * 进入
 */
const onEnter: BaseTransitionProps['onEnter'] = () => {
  updatePosition()
}

// 监听播放器容器尺寸变化
watch(
  () => portalContainerBounding,
  () => {
    visibleModel.value && updatePosition()
  },
  {
    deep: true,
  },
)

watch(
  () => props.trigger,
  (newVal, oldVal) => {
    if (newVal && !triggerSet.has(newVal)) {
      triggerSet.add(newVal)
    }
    if (!newVal && oldVal && triggerSet.has(oldVal)) {
      triggerSet.delete(oldVal)
    }
  },
)

// 点击外部
onClickOutside(popupRef, (event) => {
  if (visibleModel.value) {
    // 点击触发元素阻止冒泡
    if (props.trigger && isInContainsTrigger(event, props.trigger)) {
      event.stopPropagation()
    }

    // 如果设置了阻止冒泡，则阻止事件冒泡
    if (props.outsideStopPropagation) {
      event.stopPropagation()
    }

    // 如果popup管理器有阻止冒泡元素，且允许阻止控制栏关闭，则阻止冒泡
    // allowPreventControlsClose 为 false 的弹窗（如 HUD）不应阻止事件传播
    if (
      props.allowPreventControlsClose
      && popupManager?.disabledBubblingElements.has(event.target as HTMLElement)
    ) {
      event.stopPropagation()
    }

    // 关闭弹出层
    visibleModel.value = false
  }
})

/**
 * 离开
 */
const onAfterLeave: BaseTransitionProps['onAfterLeave'] = () => {
  emit('after-leave')
}
</script>

<style scoped>
.x-popup > * {
  position: relative;
  z-index: 1;
}
</style>
