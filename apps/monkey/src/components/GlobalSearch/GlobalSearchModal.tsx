import { useEventListener } from '@vueuse/core'
import { defineComponent, nextTick, ref, shallowRef, watch } from 'vue'
import DialogModal from '@/components/Dialog/DialogModal'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { I, Icon } from '@/icons'

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false
  if (target.isContentEditable)
    return true
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea')
    return true
  return false
}

const GlobalSearchModal = defineComponent({
  name: 'GlobalSearchModal',
  setup() {
    const inputRef = shallowRef<HTMLInputElement>()
    const composing = ref(false)
    const search = useGlobalSearch()

    watch(search.show, (v) => {
      if (!v)
        return
      nextTick(() => {
        inputRef.value?.focus()
        inputRef.value?.select()
      })
    })

    useEventListener(window, 'keydown', (e) => {
      const key = e.key.toLowerCase()
      if (e.metaKey && key === 'k') {
        if (isEditable(e.target) && !search.show.value)
          return
        e.preventDefault()
        if (search.show.value)
          search.close()
        else
          search.open()
        return
      }
      if (!search.show.value)
        return
      if (key !== 'escape')
        return
      if (composing.value || e.isComposing)
        return
      e.preventDefault()
      search.close()
    })

    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (composing.value || e.isComposing)
          return
        e.preventDefault()
        search.close()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        search.move(1)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        search.move(-1)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.isComposing)
          return
        search.submit()
      }
    }

    return () => {
      const isEmpty = !search.word.value.trim()

      return (
        <DialogModal
          id="global-search"
          visible={search.show.value}
          showConfirm={false}
          showCancel={false}
          maskClosable
          size="lg"
          className="!border-base-content/10 !bg-base-100/60 backdrop-saturate-150 max-sm:min-h-[65dvh]"
          classNameRoot="z-9999"
          classNameContent="!px-0"
          classNameActions={isEmpty ? 'hidden' : 'sm:hidden'}
          onCancel={() => search.close()}
          content={() => (
            <div class="flex h-full flex-col">
              <div class="border-base-content/10 flex items-center gap-3 border-b px-6">
                <Icon class="text-base-content/40 shrink-0" name={I.SEARCH} size="lg" />
                <input
                  ref={inputRef}
                  class="text-base-content placeholder:text-base-content/40 caret-primary h-16 min-w-0 flex-1 bg-transparent text-lg outline-none"
                  placeholder="搜索文件，按 Enter 查看结果"
                  type="text"
                  value={search.word.value}
                  onInput={e => search.change((e.target as HTMLInputElement).value)}
                  onCompositionstart={() => composing.value = true}
                  onCompositionend={() => composing.value = false}
                  onKeydown={onKeydown}
                />
                {!isEmpty && (
                  <button
                    class="bg-base-content/10 text-base-content/60 hover:bg-base-content/15 hover:text-base-content grid size-6 shrink-0 place-items-center rounded-full transition-colors"
                    type="button"
                    title="清除"
                    onClick={() => search.change('')}
                  >
                    <Icon name={I.CLOSE} size="xs" />
                  </button>
                )}
              </div>

              <div class="max-h-[48vh] flex-1 overflow-y-auto p-2 max-sm:max-h-none">
                {isEmpty && (
                  <>
                    <div class="flex items-baseline justify-between px-3 pt-2 pb-1 select-none">
                      <span class="text-base-content/45 text-xs font-medium">最近搜索</span>
                      <button
                        class="text-base-content/45 hover:text-base-content text-xs transition-colors disabled:pointer-events-none disabled:opacity-40"
                        type="button"
                        disabled={!search.history.value.length}
                        onClick={() => search.clearHistory()}
                      >
                        清空全部
                      </button>
                    </div>
                    {!search.history.value.length && (
                      <div class="text-base-content/40 px-3 py-12 text-center text-sm">
                        暂无搜索历史
                      </div>
                    )}
                    {search.history.value.map((item, i) => (
                      <div
                        key={`history-${item}-${i}`}
                        class={[
                          'group flex items-center gap-1 rounded-xl px-1 transition-colors',
                          search.idx.value === i ? 'bg-primary/15' : 'hover:bg-base-content/5',
                        ]}
                      >
                        <button
                          class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm"
                          type="button"
                          onMouseenter={() => search.setIndex(i)}
                          onClick={() => search.submit(item)}
                        >
                          <Icon class="text-base-content/40 shrink-0" name={I.HISTORY} size="sm" />
                          <span class="line-clamp-1">{item}</span>
                        </button>
                        <button
                          class="text-base-content/40 hover:bg-base-content/10 hover:text-base-content grid size-6 place-items-center rounded-full opacity-0 transition group-hover:opacity-100 max-sm:opacity-100"
                          type="button"
                          title="删除"
                          onClick={(e) => {
                            e.stopPropagation()
                            search.removeHistory(item)
                          }}
                        >
                          <Icon name={I.DELETE} size="xs" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {!isEmpty && (
                  <div class="text-base-content/40 hidden px-3 py-12 text-center text-sm sm:block">
                    按 Enter 直接搜索
                  </div>
                )}
              </div>

              <div class="border-base-content/10 text-base-content/40 hidden items-center justify-center gap-5 border-t px-5 py-2.5 text-xs select-none sm:flex">
                <span>↑↓ 选择</span>
                <span>Enter 搜索</span>
                <span>Esc 关闭</span>
              </div>
            </div>
          )}
          v-slots={{
            actions: () => !isEmpty && (
              <button
                class="btn btn-primary btn-block gap-1"
                type="button"
                onClick={() => search.submit()}
              >
                <Icon name={I.SEARCH} size="sm" />
                搜索
              </button>
            ),
          }}
        />
      )
    }
  },
})

export default GlobalSearchModal
