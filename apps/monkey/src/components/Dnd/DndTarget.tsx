import type { PropType, SlotsType } from 'vue'
import type { DndTargetBindings } from './useDnd'
import { computed, defineComponent, onBeforeUnmount, shallowRef } from 'vue'
import { useDnd } from './useDnd'

const DndTarget = defineComponent({
  name: 'DndTarget',
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    accept: {
      type: Function as PropType<(payload: unknown) => boolean>,
      default: () => true,
    },
  },
  emits: ['drop'] as const,
  slots: Object as SlotsType<{
    default: (props: { targetProps: DndTargetBindings, hovering: boolean }) => void
  }>,
  setup: (props, { emit, slots }) => {
    const dnd = useDnd()
    const el = shallowRef<HTMLElement>()
    const target = {
      el: () => el.value,
      accept: (payload: unknown) => !props.disabled && props.accept(payload),
      drop: (payload: unknown) => emit('drop', payload),
    }
    const stop = dnd.register(target)
    const targetProps: DndTargetBindings = {
      ref: (value) => {
        el.value = value instanceof HTMLElement ? value : undefined
      },
    }
    const hovering = computed(() => dnd.session.value?.target === target)
    onBeforeUnmount(stop)

    return () => slots.default?.({ targetProps, hovering: hovering.value })
  },
})

export default DndTarget
