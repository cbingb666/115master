import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import { defineComponent, shallowRef } from 'vue'

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
                  <a
                    class={[
                      'text-md font-medium',
                      'px-4 py-0.5',
                      'text-neutral-300 text-shadow-2xs',
                      'rounded-full no-underline!',
                      'hover:bg-base-200/10',
                      'data-[drop-zone=true]:bg-secondary/80',
                    ].join(' ')}
                    data-drop-zone={dropZone.value === path.cid}
                    href={`#/drive/all/${path.cid}`}
                    onClick={() => props.onPathClick?.(path)}
                    onDragleave={handleDragleave}
                    onDragover={e => handleDragover(e, path.cid)}
                    onDrop={e => handleDrop(e, path)}
                  >
                    {path.name}
                  </a>
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
