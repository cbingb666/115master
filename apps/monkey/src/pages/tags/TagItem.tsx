import type { PropType } from 'vue'
import type { Tag } from '@/store/tagList'
import { Api } from '@115master/drive115'
import { Button } from '@115master/ui'
import { defineComponent, ref } from 'vue'
import { useViewportVisibility } from '@/hooks/useViewportVisibility'
import { I, Icon } from '@/icons'

const { LabelColor } = Api.TagApi.Req

const TagItem = defineComponent({
  name: 'TagItem',
  props: {
    tag: {
      type: Object as PropType<Tag>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    selectMode: {
      type: Boolean,
      default: false,
    },
    onToggle: {
      type: Function as PropType<(on: boolean) => void>,
      required: true,
    },
    onClick: {
      type: Function as PropType<(e: MouseEvent) => void>,
      default: () => {},
    },
    onContextmenu: {
      type: Function as PropType<(e: MouseEvent) => void>,
      default: undefined,
    },
    onEdit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const itemRef = ref<HTMLElement>()
    const inViewport = useViewportVisibility(itemRef)

    return () => {
      const blank = props.tag.color === LabelColor.Blank

      return (
        <li
          ref={itemRef}
          class={[
            `
              group data-[checked=true]:bg-primary/10!
              data-[checked=true]:hover:bg-primary/15!
              hover:bg-base-content/5
              even:bg-base-content/[0.03]
              dark:even:bg-base-content/5
              dark:hover:bg-base-content/10
              relative flex min-h-14 min-w-0 cursor-pointer items-center
              overflow-x-clip rounded-xs
              px-(--main-content-gutter) transition ease-[var(--ui-ease-standard)] [contain-intrinsic-block-size:auto_3.5rem] [content-visibility:auto]
              data-[checked=true]:bg-linear-to-br
              max-sm:select-none max-sm:[-webkit-touch-callout:none]
            `,
          ]}
          data-checked={props.selected}
          data-in-viewport={inViewport.value}
          data-select-mode={props.selectMode}
          onClick={props.onClick}
          onContextmenu={props.onContextmenu}
        >
          <span
            data-checkbox-slot
            class={[
              'ui-z-cover absolute top-1/2 left-0 flex w-9 -translate-y-1/2 items-center',
              inViewport.value ? 'transition-transform duration-300 ease-[var(--ui-ease-move)] motion-reduce:transition-none' : '',
              props.selectMode
                ? 'translate-x-[var(--main-content-gutter)]'
                : 'pointer-events-none -translate-x-9',
            ]}
          >
            <input
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary flex-none opacity-100"
              checked={props.selected}
              tabindex={props.selectMode ? 0 : -1}
              onChange={e => props.onToggle((e.target as HTMLInputElement).checked)}
            />
          </span>

          <div
            data-item-content
            class={[
              'flex min-w-0 flex-1 items-center',
              inViewport.value ? 'transition-[padding-left] duration-300 ease-[var(--ui-ease-move)] motion-reduce:transition-none' : '',
              props.selectMode ? 'pl-9' : '',
            ]}
          >
            <span
              data-color-slot
              class={[
                'mr-3 size-4 flex-none rounded-full',
                blank ? 'border-base-content/30 bg-base-content/5 border' : '',
              ]}
              style={blank ? undefined : { backgroundColor: props.tag.color }}
            />

            <span
              class="min-w-0 flex-1 truncate"
              title={props.tag.name}
            >
              {props.tag.name}
            </span>

            {/* 操作按钮：移动端常显；桌面端 hover/focus 时显现（opacity 保持布局稳定） */}
            <div class="ml-3 flex flex-none items-center gap-0.5 transition-all ease-[var(--ui-ease-standard)] sm:pointer-events-none sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                shape="circle"
                title="编辑"
                onClick={() => props.onEdit()}
              >
                <Icon name={I.RENAME} size="sm" />
              </Button>
              <Button
                color="error"
                variant="ghost"
                size="sm"
                shape="circle"
                title="删除"
                onClick={() => props.onDelete()}
              >
                <Icon name={I.DELETE} size="sm" />
              </Button>
            </div>
          </div>
        </li>
      )
    }
  },
})

export default TagItem
