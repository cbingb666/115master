import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import type { FileDndTargetBindings } from '../FileDnd'
import { Pill } from '@115master/ui'
import { defineComponent, withModifiers } from 'vue'
import { FileDndTarget } from '../FileDnd'

/**
 * 面包屑单项（含 li 包装，可点击 + 文件投放目标）。
 */
const FilePathLink = defineComponent({
  name: 'FilePathLink',
  props: {
    item: {
      type: Object as PropType<Share.Entity.PathItem>,
      required: true,
    },
    onPathClick: {
      type: Function as PropType<(path: Share.Entity.PathItem) => void>,
      default: () => {},
    },
    onDragMove: {
      type: Function as PropType<(cid: string, items: Share.Entity.FilesItem[]) => void>,
      default: () => {},
    },
  },
  setup: (props) => {
    return () => (
      <FileDndTarget
        cid={props.item.cid}
        onDrop={items => props.onDragMove?.(props.item.cid, items)}
      >
        {{ default: ({ targetProps, hovering }: { targetProps: FileDndTargetBindings, hovering: boolean }) => (
          <li ref={targetProps.ref}>
            <Pill
              as="a"
              variant="glass-surface"
              class="
            data-[drop-zone=true]:bg-primary/10
            data-[drop-zone=true]:ring-primary
            no-underline!
            transition
            text-shadow-2xs
            data-[drop-zone=true]:ring-2
            data-[drop-zone=true]:ring-inset
          "
              data-drop-zone={hovering}
              href={props.item.cid === '0' ? '#/drive' : `#/drive/${props.item.cid}`}
              onClick={withModifiers(() => props.onPathClick?.(props.item), ['prevent'])}
            >
              {props.item.name}
            </Pill>
          </li>
        ) }}
      </FileDndTarget>
    )
  },
})

export default FilePathLink
