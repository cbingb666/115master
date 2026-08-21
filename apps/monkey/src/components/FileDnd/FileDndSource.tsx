import type { Share } from '@115master/drive115'
import type { DndSourceBindings } from '@115master/ui'
import type { PropType, SlotsType } from 'vue'
import { DndSource } from '@115master/ui'
import { defineComponent } from 'vue'
import FileDragPreview from './FileDragPreview'

/** 文件拖拽源适配：提供文件预览与统一跟随偏移。 */
const FileDndSource = defineComponent({
  name: 'FileDndSource',
  props: {
    items: {
      type: Function as PropType<() => Share.Entity.FilesItem[]>,
      required: true,
    },
    disabled: {
      type: Function as PropType<(event: PointerEvent) => boolean>,
      default: () => false,
    },
  },
  slots: Object as SlotsType<{
    default: (props: { sourceProps: DndSourceBindings }) => void
  }>,
  setup: (props, { slots }) => {
    return () => (
      <DndSource
        payload={props.items}
        disabled={props.disabled}
        offset={{ x: 36, y: 36 }}
      >
        {{
          default: ({ sourceProps }: { sourceProps: DndSourceBindings }) => slots.default?.({ sourceProps }),
          ghost: ({ payload }: { payload: unknown }) => (
            <FileDragPreview items={payload as Share.Entity.FilesItem[]} />
          ),
        }}
      </DndSource>
    )
  },
})

export default FileDndSource
