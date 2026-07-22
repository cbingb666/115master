import type { PropType, SlotsType } from 'vue'
import type { DndOffset, DndSourceBindings } from './useDnd'
import { defineComponent } from 'vue'
import { useDnd } from './useDnd'

const DndSource = defineComponent({
  name: 'DndSource',
  props: {
    payload: {
      type: Function as PropType<() => unknown>,
      required: true,
    },
    disabled: {
      type: Function as PropType<(event: PointerEvent) => boolean>,
      default: () => false,
    },
    offset: {
      type: Object as PropType<DndOffset>,
      default: () => ({ x: 0, y: 0 }),
    },
  },
  slots: Object as SlotsType<{
    default: (props: { sourceProps: DndSourceBindings }) => void
    ghost: (props: { payload: unknown }) => void
  }>,
  setup: (props, { slots }) => {
    const dnd = useDnd()
    const sourceProps: DndSourceBindings = {
      onPointerdown: event => dnd.start(event, {
        payload: props.payload,
        disabled: props.disabled,
        offset: props.offset,
        ghost: payload => slots.ghost?.({ payload }),
      }),
    }

    return () => slots.default?.({ sourceProps })
  },
})

export default DndSource
