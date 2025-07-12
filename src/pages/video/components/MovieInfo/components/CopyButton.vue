<template>
  <button
    :class="[
      styles.button.base,
      isCopied ? styles.button.success : styles.button.normal,
    ]"
    @click="handleCopy"
  >
    <Icon :icon="ICON_COPY" class="size-4" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ICON_COPY } from '../../../../../icons'
import { useCopy } from '../hooks/useCopy'

const props = defineProps<{
  /** 要复制的文本 */
  text: string
  /** 复制成功后状态保持的时间（毫秒） */
  duration?: number
}>()

const { isCopied, copyText } = useCopy(props.duration)

/** 处理复制按钮点击事件 */
async function handleCopy() {
  await copyText(props.text)
}

/** 样式常量定义 */
const styles = {
  button: {
    base: 'btn btn-xs btn-ghost btn-circle transition-all duration-200 ease-in-out',
    normal: 'btn-neutral',
    success: 'btn-primary',
  },
  text: 'whitespace-nowrap text-xs',
}
</script>

<style scoped>
/* DaisyUI 已提供所有需要的样式 */
</style>
