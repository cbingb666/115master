<template>
  <Popup
    v-model:visible="visibleModel"
    :x="props.x"
    :y="props.y"
    :trigger="trigger"
    :placement="props.placement"
    :offset="props.offset"
  >
    <div>
      <slot />
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import Popup from '@/components/XPlayer/components/Popup/index.vue'

interface Props {
  visible: boolean
  x?: number
  y?: number
  trigger?: HTMLElement
  placement?: 'top' | 'bottom'
  offset?: number
}

const props = defineProps<Props>()
const emit = defineEmits<(e: 'update:visible', value: boolean) => void>()
const visibleModel = useVModel(props, 'visible', emit)
</script>
