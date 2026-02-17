import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import { defineComponent, shallowRef, withModifiers } from 'vue'
import { Link } from '../Link'

/**
 * 文件路径面包屑导航
 */
const FilePaths = defineComponent({
  name: 'FilePaths',
  props: {
    /**
     * 路径
     */
    paths: {
      type: Array as PropType<WebApi.Entity.PathItem[]>,
      required: true,
    },
    /**
     * 点击路径
     */
    onPathClick: {
      type: Function as PropType<(path: WebApi.Entity.PathItem) => void>,
      default: () => {},
    },
    /**
     * 拖拽移动
     */
    onDragMove: {
      type: Function as PropType<(cid: string, items: WebApi.Entity.FilesItem[]) => void>,
      default: () => {},
    },
    /**
     * 路径选择模式（用于对话框，不导航）
     */
    pathSelect: {
      type: Boolean,
      default: false,
    },
  },
  setup: (props) => {
    const dropZone = shallowRef<string>()

    const handleDragover = (e: DragEvent, cid: string) => {
      e.preventDefault()
      dropZone.value = cid
    }

    const handleDragleave = () => {
      dropZone.value = undefined
    }

    const handleDrop = (e: DragEvent, item: WebApi.Entity.PathItem) => {
      const data = e.dataTransfer?.getData('application/json')
      if (!data)
        return

      const items = JSON.parse(data) as WebApi.Entity.FilesItem[]
      props.onDragMove?.(item.cid, items)
      dropZone.value = undefined
    }

    return () => (
      <div class="breadcrumbs">
        <ul>
          {
            props.paths.map((path) => {
              return (
                <li key={path.cid}>
                  <Link
                    class="
                      text-md
                      hover:bg-base-200/10
                      data-[drop-zone=true]:bg-secondary/80
                      rounded-full
                      px-4 py-0.5 font-medium
                    text-neutral-300
                      no-underline!
                      text-shadow-2xs
                    "
                    data-drop-zone={dropZone.value === path.cid}
                    href={`#/drive/all/${path.cid}`}
                    onClick={withModifiers(() => props.onPathClick?.(path), ['prevent'])}
                    onDragleave={handleDragleave}
                    onDragover={e => handleDragover(e, path.cid)}
                    onDrop={e => handleDrop(e, path)}
                  >
                    {path.name}
                  </Link>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  },
})

export default FilePaths
