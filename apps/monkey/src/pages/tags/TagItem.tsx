import type { PropType } from 'vue'
import type { Tag } from '@/store/tagList'
import { Api } from '@115master/drive115'
import { Button } from '@115master/ui'
import { defineComponent, ref } from 'vue'
import { useLongPress } from '@/hooks/useLongPress'
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
    const fired = useLongPress(itemRef, {
      disabled: e => props.selectMode || Boolean((e.target as HTMLElement).closest('button, input, label')),
      threshold: 200,
      onTrigger: () => {
        if (!props.selected)
          props.onToggle(true)
      },
    })

    function click(e: MouseEvent) {
      if (fired.value) {
        fired.value = false
        return
      }
      props.onClick(e)
    }

    return () => {
      const blank = props.tag.color === LabelColor.Blank

      return (
        <li
          ref={itemRef}
          class={[
            'group flex cursor-pointer items-center rounded-lg px-3 py-3 transition-colors sm:rounded-md sm:px-3 sm:py-2',
            // 选中：primary 高亮（含 hover）；未选中：卡片灰底 / 行 hover 灰底
            props.selected
              ? 'bg-primary/10 sm:bg-primary/10'
              : 'bg-base-content/5 sm:hover:bg-base-content/5 sm:bg-transparent',
          ]}
          onClick={click}
          onContextmenu={props.onContextmenu}
        >
          <span
            data-checkbox-slot
            class={[
              'flex flex-none items-center overflow-hidden transition-[width,opacity] duration-300',
              props.selectMode
                ? 'w-8 opacity-100'
                : 'pointer-events-none w-0 opacity-0',
            ]}
          >
            <input
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary flex-none"
              checked={props.selected}
              tabindex={props.selectMode ? 0 : -1}
              onChange={e => props.onToggle((e.target as HTMLInputElement).checked)}
            />
          </span>

          {/* 色块：无色用描边圈，有色用 color-mix 填充 */}
          <span
            class={[
              'mr-3 size-4 flex-none rounded-full',
              blank ? 'border-base-content/30 bg-base-content/5 border' : '',
            ]}
            style={blank ? undefined : { backgroundColor: props.tag.color }}
          />

          <span
            class="min-w-0 flex-1 truncate font-medium"
            title={props.tag.name}
          >
            {props.tag.name}
          </span>

          {/* 操作按钮：移动端常显；桌面端 hover/focus 时显现（opacity 保持布局稳定） */}
          <div class="ml-3 flex flex-none items-center gap-0.5 transition-all sm:pointer-events-none sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100">
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
        </li>
      )
    }
  },
})

export default TagItem
