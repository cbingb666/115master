import type { PropType } from 'vue'
import type { Tag } from '@/store/tagList'
import { Api } from '@115master/drive115'
import { defineComponent } from 'vue'
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
    onToggle: {
      type: Function as PropType<(on: boolean) => void>,
      required: true,
    },
    onClick: {
      type: Function as PropType<(e: MouseEvent) => void>,
      default: () => {},
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
    return () => {
      const blank = props.tag.color === LabelColor.Blank

      return (
        <li
          class={[
            'group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors sm:rounded-md sm:px-3 sm:py-2',
            // 选中：primary 高亮（含 hover）；未选中：卡片灰底 / 行 hover 灰底
            props.selected
              ? 'bg-primary/10 sm:bg-primary/10'
              : 'bg-base-content/5 sm:hover:bg-base-content/5 sm:bg-transparent',
          ]}
          onClick={props.onClick}
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary flex-none"
            checked={props.selected}
            onChange={e => props.onToggle((e.target as HTMLInputElement).checked)}
          />

          {/* 色块：无色用描边圈，有色用 color-mix 填充 */}
          <span
            class={[
              'size-4 flex-none rounded-full',
              blank ? 'border-base-content/30 bg-base-content/5 border' : '',
            ]}
            style={blank ? undefined : { backgroundColor: `color-mix(in oklab, ${props.tag.color} 65%, transparent)` }}
          />

          <span
            class="min-w-0 flex-1 truncate font-medium"
            title={props.tag.name}
          >
            {props.tag.name}
          </span>

          <div class="flex flex-none items-center gap-0.5">
            <button
              type="button"
              class="btn btn-ghost btn-sm gap-1"
              title="编辑"
              onClick={() => props.onEdit()}
            >
              <Icon name={I.RENAME} size="sm" />
              <span class="hidden sm:inline">编辑</span>
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm text-error hover:bg-error/10 gap-1"
              title="删除"
              onClick={() => props.onDelete()}
            >
              <Icon name={I.DELETE} size="sm" />
              <span class="hidden sm:inline">删除</span>
            </button>
          </div>
        </li>
      )
    }
  },
})

export default TagItem
