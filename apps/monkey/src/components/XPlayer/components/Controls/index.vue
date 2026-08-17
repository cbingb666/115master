<template>
  <div
    :class="styles.root"
    :data-mask="progressBar.isLongPressDragging.value"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  root: [
    'absolute inset-0 flex flex-col',
    'transition-all duration-500 ease-[var(--ui-ease-standard)]',
    'data-[mask="true"]:bg-black/50',
  ],
})

const { progressBar } = usePlayerContext()
</script>
