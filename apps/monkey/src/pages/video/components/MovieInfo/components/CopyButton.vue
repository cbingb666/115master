<template>
  <button
    :class="[
      styles.button.base,
      isCopied ? styles.button.success : styles.button.normal,
    ]"
    @click="handleCopy"
  >
    <Icon :name="I.COPY" class="size-4" />
  </button>
</template>

<script setup lang="ts">
import { I, Icon } from '@/icons'
import { useCopy } from '@/pages/video/components/MovieInfo/hooks/useCopy'
import { clsx } from '@/utils/clsx'

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
const styles = clsx({
  button: {
    base: 'btn btn-xs btn-ghost transition-all duration-200 ease-in-out',
    normal: 'btn-neutral',
    success: 'btn-primary',
  },
  text: 'text-xs whitespace-nowrap',
})
</script>

<style scoped>
/* DaisyUI 已提供所有需要的样式 */
</style>
