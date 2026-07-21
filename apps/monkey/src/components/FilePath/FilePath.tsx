import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { defineComponent, shallowRef, withModifiers } from 'vue'
import { ResponsiveMenu } from '@/components'
import { I, Icon } from '@/icons'
import { Link } from '../Link'

/**
 * 文件路径面包屑导航
 */
const FilePath = defineComponent({
  name: 'FilePath',
  props: {
    /**
     * 路径
     */
    path: {
      type: Array as PropType<Share.Entity.PathItem[]>,
      required: true,
    },
    /**
     * 点击路径
     */
    onPathClick: {
      type: Function as PropType<(path: Share.Entity.PathItem) => void>,
      default: () => {},
    },
    /**
     * 拖拽移动
     */
    onDragMove: {
      type: Function as PropType<(cid: string, items: Share.Entity.FilesItem[]) => void>,
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
    const breakpoints = useBreakpoints(breakpointsTailwind)

    const handleDragover = (e: DragEvent, cid: string) => {
      e.preventDefault()
      dropZone.value = cid
    }

    const handleDragleave = () => {
      dropZone.value = undefined
    }

    const handleDrop = (e: DragEvent, item: Share.Entity.PathItem) => {
      const data = e.dataTransfer?.getData('application/json')
      if (!data)
        return

      const items = JSON.parse(data) as Share.Entity.FilesItem[]
      props.onDragMove?.(item.cid, items)
      dropZone.value = undefined
    }

    return () => {
      const { path } = props
      const last = (i: number) => i === path.length - 1

      if (path.length === 0)
        return <div class="breadcrumbs rounded-full py-0"><ul></ul></div>

      if (breakpoints.greater('sm').value || props.pathSelect || path.length <= 1) {
        return (
          <div class="breadcrumbs rounded-full py-0">
            <ul>
              {path.map((p, i) => (
                <li key={p.cid}>
                  {last(i)
                    ? (
                        <span
                          aria-current="page"
                          class="
                            pill
                            text-base-content/70
                            cursor-default
                            text-shadow-2xs
                          "
                        >
                          {p.name}
                        </span>
                      )
                    : (
                        <Link
                          class="
                            pill
                            data-[drop-zone=true]:bg-primary
                            no-underline!
                            text-shadow-2xs
                          "
                          data-drop-zone={dropZone.value === p.cid}
                          href={p.cid === '0' ? '#/drive' : `#/drive/${p.cid}`}
                          onClick={withModifiers(() => props.onPathClick?.(p), ['prevent'])}
                          onDragleave={handleDragleave}
                          onDragover={e => handleDragover(e, p.cid)}
                          onDrop={e => handleDrop(e, p)}
                        >
                          {p.name}
                        </Link>
                      )}
                </li>
              ))}
            </ul>
          </div>
        )
      }

      const lastPath = path[path.length - 1]
      return (
        <ResponsiveMenu title="文件路径">
          {{
            target: (trigger: { onClick: () => void }) => (
              <button
                class="
                  bg-base-content/15
                  hover:bg-base-content/25
                  inline-flex
                  items-center
                  gap-1
                  rounded-full
                  px-3
                  py-1
                  text-sm
                  font-semibold
                "
                onClick={trigger.onClick}
              >
                {lastPath.name}
                <Icon name={I.CHEVRON_DOWN} size="sm" />
              </button>
            ),
            default: () => path.map((p, i) => (
              <li key={p.cid}>
                {last(i)
                  ? (
                      <span
                        aria-current="page"
                        class="flex items-center gap-2 px-3 py-2 text-left font-semibold"
                      >
                        <Icon name={I.FILE_FOLDER} size="sm" />
                        <span class="flex-1 truncate">{p.name}</span>
                        <span class="text-base-content/50 text-xs font-normal">当前</span>
                      </span>
                    )
                  : (
                      <Link
                        class="flex items-center gap-2 text-left no-underline!"
                        href={p.cid === '0' ? '#/drive' : `#/drive/${p.cid}`}
                        onClick={withModifiers(() => props.onPathClick?.(p), ['prevent'])}
                      >
                        <Icon name={I.FILE_FOLDER} size="sm" />
                        <span class="flex-1 truncate">{p.name}</span>
                        <Icon class="text-base-content/40" name={I.RIGHT} size="sm" />
                      </Link>
                    )}
              </li>
            )),
          }}
        </ResponsiveMenu>
      )
    }
  },
})

export default FilePath
