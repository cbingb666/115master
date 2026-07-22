import type { Share } from '@115master/drive115'
import type { SlotsType } from 'vue'
import type { DndTargetBindings } from '../Dnd'
import { defineComponent } from 'vue'
import { getFilesItemId } from '@/utils/filesItem'
import { DndTarget } from '../Dnd'

/** 文件投放目标适配：统一拒绝拖入被拖集合自身。 */
const FileDndTarget = defineComponent({
  name: 'FileDndTarget',
  props: {
    cid: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['drop'] as const,
  slots: Object as SlotsType<{
    default: (props: { targetProps: DndTargetBindings, hovering: boolean }) => void
  }>,
  setup: (props, { emit, slots }) => {
    const accept = (payload: unknown) => {
      if (!Array.isArray(payload))
        return false
      const items = payload as Share.Entity.FilesItem[]
      return !items.some(item => getFilesItemId(item) === props.cid)
    }

    return () => (
      <DndTarget
        disabled={props.disabled}
        accept={accept}
        onDrop={payload => emit('drop', payload as Share.Entity.FilesItem[])}
      >
        {{
          default: ({ targetProps, hovering }: { targetProps: DndTargetBindings, hovering: boolean }) => slots.default?.({ targetProps, hovering }),
        }}
      </DndTarget>
    )
  },
})

export default FileDndTarget
