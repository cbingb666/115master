import type { PropType } from 'vue'
import { Api } from '@115master/drive115'
import { defineComponent } from 'vue'
import { I, Icon } from '@/icons'
import { TAG_NAME_MAX_LENGTH } from '@/store/tagList'

const { LabelColor } = Api.TagApi.Req

/** 8 种预设色（含无色 Blank） */
const COLORS = Object.values(LabelColor)

/** 创建 / 编辑弹窗共享的表单状态（由页面持有，透传给本组件与 confirmCallback） */
export interface TagFormState {
  name: string
  color: string
  error: string
  submitting: boolean
}

/**
 * 创建 / 编辑标签的表单内容（作为 useDialog.create 的 content）。
 *
 * 直接 mutate 传入的 reactive `form`，供对话框 confirmCallback 读取并校验。
 */
const TagFormContent = defineComponent({
  name: 'TagFormContent',
  props: {
    form: {
      type: Object as PropType<TagFormState>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col gap-4 py-1">
        <label class="flex flex-col gap-1.5">
          <span class="text-base-content/70 text-sm">名称</span>
          <input
            class="input input-bordered input-sm h-10 w-full"
            value={props.form.name}
            maxlength={TAG_NAME_MAX_LENGTH}
            placeholder={`最多 ${TAG_NAME_MAX_LENGTH} 个字符`}
            onInput={(e) => {
              props.form.name = (e.target as HTMLInputElement).value
              props.form.error = ''
            }}
          />
        </label>

        <div class="flex flex-col gap-1.5">
          <span class="text-base-content/70 text-sm">颜色</span>
          <div class="flex flex-wrap items-center gap-2.5">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                title={c === LabelColor.Blank ? '无色' : c}
                aria-label={c === LabelColor.Blank ? '无色' : c}
                class={[
                  'flex size-7 items-center justify-center rounded-full border-2 transition-transform',
                  props.form.color === c
                    ? 'border-primary ring-primary/30 scale-110 ring-2'
                    : 'border-base-content/10 hover:border-base-content/30',
                  c === LabelColor.Blank ? 'bg-base-content/5' : '',
                ]}
                style={c === LabelColor.Blank ? undefined : { backgroundColor: c }}
                onClick={() => {
                  props.form.color = c
                  props.form.error = ''
                }}
              >
                {c === LabelColor.Blank && <Icon name={I.CLOSE} size="xs" class="text-base-content/40" />}
              </button>
            ))}
          </div>
        </div>

        <div class="text-error min-h-4 text-xs">{props.form.error}</div>
      </div>
    )
  },
})

export default TagFormContent
