import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import { useDnd } from './useDnd'

const DndMonitor = defineComponent({
  name: 'DndMonitor',
  slots: Object as SlotsType<{
    default: (props: { active: boolean }) => void
  }>,
  setup: (_props, { slots }) => {
    const dnd = useDnd()
    return () => slots.default?.({ active: dnd.active.value })
  },
})

export default DndMonitor
