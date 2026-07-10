import { useEventListener } from '@vueuse/core'
import { defineComponent, nextTick, ref, shallowRef, watch } from 'vue'
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

    function onEnter() {
      search.submit()
    }

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
        onEnter()
      }
    }

    return () => {
      if (!search.show.value)
        return null

      const isEmpty = !search.word.value.trim()

      return (
        <div
          class="fixed inset-0 z-10000 flex items-start justify-center bg-black/30 p-4 pt-[12vh] backdrop-blur-xs"
          onClick={() => search.close()}
        >
          <div
            class="bg-base-100/92 border-base-content/10 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div class="border-base-content/10 flex items-center gap-3 border-b px-4 py-3">
              <Icon class="text-base-content/70 shrink-0 text-2xl" name={I.SEARCH} />
              <input
                ref={inputRef}
                class="h-10 w-full bg-transparent outline-none"
                placeholder="搜索文件，按 Enter 查看结果"
                type="text"
                value={search.word.value}
                onInput={e => search.change((e.target as HTMLInputElement).value)}
                onCompositionstart={() => composing.value = true}
                onCompositionend={() => composing.value = false}
                onKeydown={onKeydown}
              />
              <button
                class="btn btn-ghost btn-sm btn-circle"
                type="button"
                onClick={() => search.close()}
              >
                <Icon class="text-xl" name={I.CLOSE} />
              </button>
            </div>
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
                        search.idx.value === i ? 'bg-primary/15' : 'hover:bg-base-content/8',
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
          </div>
        </div>
      )
    }
  },
})

export default GlobalSearchModal
