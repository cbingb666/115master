import type { SlotsType } from 'vue'
import { defineComponent, onBeforeUnmount } from 'vue'
import DndLayer from './DndLayer'
import { provideDnd } from './useDnd'

const DndRoot = defineComponent({
  name: 'DndRoot',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_props, { slots }) => {
    const dnd = provideDnd()
    onBeforeUnmount(dnd.dispose)

    return () => (
      <>
        {slots.default?.()}
        <DndLayer />
      </>
    )
  },
})

export default DndRoot
