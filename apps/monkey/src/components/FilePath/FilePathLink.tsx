import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { defineComponent, shallowRef, withModifiers } from 'vue'
import { useDndTarget } from '@/components/Dnd'
import { Link } from '../Link'

/**
 * 面包屑单项（含 li 包装，可点击 + 拖拽投放目标）
 * 抽成子组件：path 循环内无法直接调用 composable
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
    const el = shallowRef<HTMLElement>()

    const target = useDndTarget<Share.Entity.FilesItem[]>({
      id: props.item.cid,
      el: () => el.value,
      accept: () => true,
      onDrop: items => props.onDragMove?.(props.item.cid, items),
    })

    return () => (
      <li ref={el}>
        <Link
          class="
            pill
            data-[drop-zone=true]:bg-primary/10
            data-[drop-zone=true]:ring-primary
            no-underline!
            transition
            text-shadow-2xs
            data-[drop-zone=true]:ring-2
            data-[drop-zone=true]:ring-inset
          "
          data-drop-zone={target.hovering.value}
          href={props.item.cid === '0' ? '#/drive' : `#/drive/${props.item.cid}`}
          onClick={withModifiers(() => props.onPathClick?.(props.item), ['prevent'])}
        >
          {props.item.name}
        </Link>
      </li>
    )
  },
})

export default FilePathLink
