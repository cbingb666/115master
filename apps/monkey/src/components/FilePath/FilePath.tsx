import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { Button, Pill } from '@115master/ui'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { defineComponent, withModifiers } from 'vue'
import { ResponsiveMenu } from '@/components'
import { I, Icon } from '@/icons'
import { Link } from '../Link'
import FilePathLink from './FilePathLink'

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
    const breakpoints = useBreakpoints(breakpointsTailwind)

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
                last(i)
                  ? (
                      <li key={p.cid}>
                        <Pill
                          aria-current="page"
                          variant="glass-floating"
                          class="
                            text-base-content/70
                            cursor-default
                            no-underline!
                            text-shadow-2xs
                          "
                        >
                          {p.name}
                        </Pill>
                      </li>
                    )
                  : (
                      <FilePathLink
                        key={p.cid}
                        item={p}
                        onDragMove={props.onDragMove}
                        onPathClick={props.onPathClick}
                      />
                    )
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
              <Button
                variant="glass-floating"
                size="sm"
                onClick={trigger.onClick}
              >
                {lastPath.name}
                <Icon name={I.CHEVRON_DOWN} size="sm" />
              </Button>
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
