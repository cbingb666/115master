<template>
  <Button
    :color="isCopied ? 'primary' : 'neutral'"
    variant="ghost"
    size="xs"
    shape="circle"
    :class="styles.button"
    @click="handleCopy"
  >
    <Icon :name="I.COPY" class="size-4" />
  </Button>
</template>

<script setup lang="ts">
import { Button } from '@115master/ui'
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
  button: 'transition-colors duration-200 ease-[var(--ui-ease-standard)]',
  text: 'text-xs whitespace-nowrap',
})
</script>

<style scoped>
/* DaisyUI 已提供所有需要的样式 */
</style>
