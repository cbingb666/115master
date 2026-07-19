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
          className="!max-w-2xl"
          classNameRoot="z-9999"
          classNameContent="!px-0"
          classNameActions="hidden"
          onCancel={() => search.close()}
          title={() => (
            <div class="flex w-full items-center gap-3">
              <Icon class="text-base-content/70 shrink-0 text-2xl" name={I.SEARCH} />
              <input
                ref={inputRef}
                class="h-10 flex-1 bg-transparent !text-base !font-normal outline-none"
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
                  class="text-base-content/70 hover:text-base-content flex-none text-xl"
                  type="button"
                  title="清除"
                  onClick={() => search.change('')}
                >
                  <Icon name={I.CLOSE} />
                </button>
              )}
            </div>
          )}
          titleActions={() => !isEmpty && (
            <button
              class="btn btn-primary btn-sm gap-1"
              type="button"
              onClick={() => search.submit()}
            >
              <Icon name={I.SEARCH} size="sm" />
              搜索
            </button>
          )}
          content={() => (
            <div class="max-h-[48vh] overflow-y-auto p-2">
              {isEmpty && (
                <>
                  <div class="text-base-content/70 flex items-center justify-between px-3 pt-2 pb-3 text-sm">
                    <span>最近搜索</span>
                    <button
                      class="btn btn-ghost btn-xs"
                      type="button"
                      disabled={!search.history.value.length}
                      onClick={() => search.clearHistory()}
                    >
                      清空全部
                    </button>
                  </div>
                  {!search.history.value.length && (
                    <div class="text-base-content/60 px-3 py-6 text-sm">
                      暂无搜索历史
                    </div>
                  )}
                  {search.history.value.map((item, i) => (
                    <div
                      key={`history-${item}-${i}`}
                      class={[
                        'flex items-center gap-2 rounded-xl px-2 py-1 transition-colors',
                        search.idx.value === i ? 'bg-primary/15' : 'hover:bg-base-content/5',
                      ]}
                    >
                      <button
                        class="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left"
                        type="button"
                        onMouseenter={() => search.setIndex(i)}
                        onClick={() => search.submit(item)}
                      >
                        <Icon class="text-base-content/70 shrink-0 text-lg" name={I.HISTORY} />
                        <span class="line-clamp-1">{item}</span>
                      </button>
                      <button
                        class="btn btn-ghost btn-xs btn-circle"
                        type="button"
                        title="删除"
                        onClick={(e) => {
                          e.stopPropagation()
                          search.removeHistory(item)
                        }}
                      >
                        <Icon class="text-base-content/70 text-base" name={I.DELETE} />
                      </button>
                    </div>
                  ))}
                </>
              )}
              {!isEmpty && (
                <div class="text-base-content/60 px-3 py-6 text-sm">
                  按 Enter 直接搜索
                </div>
              )}
            </div>
          )}
        />
      )
    }
  },
})

export default GlobalSearchModal
