import type { PropType } from 'vue'
import { Api } from '@115master/drive115'
import { defineComponent } from 'vue'
import { Empty, LoadingError } from '@/components'
import { I, Icon } from '@/icons'
import { useTagStore } from '@/store/tagList'

const { LabelColor } = Api.TagApi.Req

/** 打标签弹窗的勾选 / 提交态（由调用方持有 reactive 对象，组件直接 mutate） */
export interface TagPickerState {
  /** dialog 内独立勾选态（不复用 useTagStore.selected） */
  checked: Set<string>
  /** 提交中（供 confirmCallback 防重复触发；不再用于渲染按钮态） */
  submitting: boolean
}

/**
 * 打标签弹窗内容（作为 `useDialog.create` 的 content）。
 *
 * 复用 `useTagStore` 作为标签目录数据源（`tags` / `filtered` / `keyword`），
 * 但勾选态用独立的 `state.checked`，**不复用** `useTagStore.selected`
 *（后者服务标签管理页批量删除，复用会跨页污染）。
 *
 * 搜索词经 `useTagStore.keyword` 透传到 `filtered`；其为 dialog 内临时态，
 * 由调用方在打开时重置，不进 URL（区别于标签管理页的 URL 搜索词）。
 *
 * 取消 / 应用按钮由通用 dialog action 提供（`confirmText` / `cancelText` +
 * `confirmCallback`），内容区只渲染列表与搜索。
 */
const TagPickerContent = defineComponent({
  name: 'TagPickerContent',
  props: {
    /** dialog 内独立勾选态 + 提交态（由调用方持有，组件直接 mutate） */
    state: {
      type: Object as PropType<TagPickerState>,
      required: true,
    },
    /** 选中文件标签交集（初始勾选） */
    intersection: {
      type: Object as PropType<Set<string>>,
      required: true,
    },
    onGotoTags: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const store = useTagStore()

    function toggle(id: string, on: boolean) {
      const next = new Set(props.state.checked)
      if (on)
        next.add(id)
      else
        next.delete(id)
      props.state.checked = next
    }

    return () => {
      const list = store.filtered

      return (
        <div class="flex flex-col py-1">
          {/* 搜索框：标签库非空时才展示 */}
          {store.tags.length > 0 && (
            <div class="bg-base-content/10 mb-3 flex h-9 items-center gap-2 rounded-full px-3">
              <Icon name={I.SEARCH} size="sm" class="text-base-content/50 flex-none" />
              <input
                class="h-full w-full bg-transparent text-sm outline-none"
                value={store.keyword}
                placeholder="搜索标签"
                aria-label="搜索标签"
                onInput={e => store.setKeyword((e.target as HTMLInputElement).value)}
              />
              {store.keyword && (
                <button
                  type="button"
                  class="text-base-content/50 hover:text-base-content flex-none"
                  title="清除"
                  onClick={() => store.setKeyword('')}
                >
                  <Icon name={I.CLOSE} size="xs" />
                </button>
              )}
            </div>
          )}

          {/* 列表区：加载 / 错误 / 空目录 / 无匹配 / 列表 */}
          <div class="flex max-h-[45vh] flex-1 flex-col overflow-y-auto">
            {store.error
              ? (
                  <div class="flex items-center justify-center py-10">
                    <LoadingError
                      message={store.error}
                      retryable
                      retryText="重试"
                      onRetry={() => store.load()}
                    />
                  </div>
                )
              : store.loading
                ? (
                    <div class="flex items-center justify-center py-10">
                      <span class="loading loading-spinner loading-md text-base-content/40" />
                    </div>
                  )
                : store.tags.length === 0
                  ? (
                      <div class="py-6">
                        <Empty icon={I.TAG} description="暂无标签，请先在标签管理页创建">
                          <button
                            type="button"
                            class="btn btn-primary btn-sm gap-1"
                            onClick={() => props.onGotoTags()}
                          >
                            <Icon name={I.RIGHT} size="sm" />
                            去创建标签
                          </button>
                        </Empty>
                      </div>
                    )
                  : list.length === 0
                    ? (
                        <div class="text-base-content/60 py-10 text-center text-sm">
                          无匹配标签
                        </div>
                      )
                    : (
                        <ul class="flex flex-col gap-1">
                          {list.map((tag) => {
                            const blank = tag.color === LabelColor.Blank
                            const checked = props.state.checked.has(tag.id)
                            return (
                              <li key={tag.id}>
                                <label
                                  class={[
                                    'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors',
                                    'hover:bg-base-content/5',
                                  ]}
                                >
                                  <input
                                    type="checkbox"
                                    class="checkbox checkbox-sm checkbox-primary flex-none"
                                    checked={checked}
                                    onChange={e => toggle(tag.id, (e.target as HTMLInputElement).checked)}
                                  />
                                  <span
                                    class={[
                                      'size-4 flex-none rounded-full',
                                      blank ? 'border-base-content/30 bg-base-content/5 border' : '',
                                    ]}
                                    style={blank ? undefined : { backgroundColor: tag.color }}
                                  />
                                  <span class="min-w-0 flex-1 truncate font-medium" title={tag.name}>
                                    {tag.name}
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      )}
          </div>
        </div>
      )
    }
  },
})

export default TagPickerContent
