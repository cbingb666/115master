<template>
  <IconifyIcon v-if="isIon" :icon="resolved" :class="cls" />
  <component :is="customComp" v-else :class="cls" />
</template>

<script setup lang="ts">
import type { IconSize } from './types'
import { Icon as IconifyIcon } from '@iconify/vue'
import { computed, defineAsyncComponent } from 'vue'
import { clsx } from '@/utils/clsx'
import { I } from './registry'

const props = withDefaults(defineProps<{
  name: string
  size?: IconSize
}>(), { size: 'md' })

const SIZE_MAP: Record<IconSize, string> = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-7',
  custom: '',
}

const cls = computed(() => clsx(SIZE_MAP[props.size]))

const resolved = computed(() => I[props.name as keyof typeof I] ?? props.name)

const isIon = computed(() => resolved.value?.startsWith('ion:'))

const customComp = computed(() => {
  if (isIon.value)
    return null
  const file = resolved.value.replace('custom:', '')
  return defineAsyncComponent(() => import(`./custom/${file}.vue`))
})
</script>
