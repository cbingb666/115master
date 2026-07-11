import type { Share } from '@115master/drive115'
import type { Ref } from 'vue'
import type { NavSource } from '@/hooks/useDriveNav/types'
import type { Action } from '@/types/action'
import { useStorage, watchDebounced } from '@vueuse/core'
import { computed, defineComponent, ref, shallowRef, watch } from 'vue'
import {
  DialogTitle,
  FileContextMenu,
  FileItem,
  FileItemThumbnail,
  FileList,
  FileMenu,
  FileNewFolderButton,
  FilePageSizeSelector,
  FilePath,
  FileSortSelector,
  FileViewType,
  Pagination,
} from '@/components'
import { useDeleteAction } from '@/hooks/useDriveAction/useDeleteAction'
import { useFileAction } from '@/hooks/useDriveAction/useFileAction'
import { useDriveExplorer } from '@/hooks/useDriveExplorer'
import { useStackNav } from '@/hooks/useDriveNav'
import { I, Icon } from '@/icons'

/** 文件浏览器内容组件 */
const FileBroswer = defineComponent({
  name: 'FileBroswer',
  props: {
    title: {
      type: String,
      required: true,
    },
    defaultCid: {
      type: String,
      default: '0',
    },
    cid: {
      type: Object as () => Ref<string>,
      required: true,
    },
    keyword: {
      type: Object as () => Ref<string>,
      required: false,
    },
    currentPathRef: {
      type: Object as () => Ref<Partial<Share.Entity.PathItem>[] | null>,
      required: false,
    },
    nav: {
      type: Object as () => NavSource & { push: (cid: string) => void },
      required: false,
    },
  },
  setup(props) {
    const nav = props.nav ?? useStackNav(props.defaultCid ?? '0')
    const keywordInput = ref(props.keyword?.value ?? '')
    const keyword = ref(props.keyword?.value ?? '')
    const scrollRef = ref<HTMLDivElement>()
    const hasExternalNav = !!props.nav
    const viewType = useStorage<'list' | 'card'>('115Master_file_browser_view_type', 'list')
    const source = {
      cid: computed(() => keyword.value.trim() ? '0' : nav.cid.value),
      area: computed(() => keyword.value.trim() ? 'search' : nav.area.value),
      direction: nav.direction,
    }
    const explorer = useDriveExplorer({
      nav: source,
      page: ref(1),
      size: ref(20),
      fc: 1,
      nf: ref('1'),
      keyword,
      scroll: hasExternalNav,
      getScroll: () => scrollRef.value?.scrollTop ?? 0,
      setScroll: (top: number) => scrollRef.value?.scrollTo({ top, behavior: 'instant' }),
    })
    const { newFolder, renameItem } = useFileAction()
    const { deleteBatch } = useDeleteAction()
    const contextmenuShow = shallowRef(false)
    const contextmenuPosition = shallowRef({ x: 0, y: 0 })
    const contextmenuItem = shallowRef<Share.Entity.FilesItem | null>(null)

    function handleContextmenu(item: Share.Entity.FilesItem, e: MouseEvent) {
      e.preventDefault()
      contextmenuItem.value = item
      contextmenuPosition.value = { x: e.clientX, y: e.clientY }
      contextmenuShow.value = true
    }

    async function handleNewFolder() {
      if (await newFolder(nav.cid.value || '0'))
        explorer.refresh()
    }

    async function handleRename() {
      if (!contextmenuItem.value)
        return
      if (await renameItem(contextmenuItem.value))
        explorer.refresh()
    }

    async function handleDelete() {
      if (!contextmenuItem.value)
        return
      if (await deleteBatch(nav.cid.value || '0', [contextmenuItem.value]))
        explorer.refresh()
    }

    const contextmenuActions = computed<Action[][]>(() => [
      [
        { name: 'rename', label: '重命名', icon: I.RENAME, onClick: handleRename },
        { name: 'delete', label: '删除', icon: I.DELETE, onClick: handleDelete },
      ],
    ])

    // 同步 cid 到外部
    watch(nav.cid, (cid) => {
      props.cid.value = cid
    })

    watch(() => props.keyword?.value, (value) => {
      if (value === undefined)
        return
      if (value !== keyword.value)
        keyword.value = value
      if (value !== keywordInput.value)
        keywordInput.value = value
    }, { immediate: true })

    watchDebounced(keywordInput, (value) => {
      keyword.value = value
      if (props.keyword)
        props.keyword.value = value
    }, { debounce: 300, maxWait: 1000 })

    function clearKeyword() {
      keywordInput.value = ''
      keyword.value = ''
      if (props.keyword)
        props.keyword.value = ''
    }

    // 同步路径到外部
    watch(explorer.path, (p) => {
      if (props.currentPathRef)
        props.currentPathRef.value = p
    }, { immediate: true })

    function handleClickPath(data: Share.Entity.PathItem) {
      nav.push(data.cid)
    }

    function handleClickItem(data: Share.Entity.FilesItem) {
      if (keyword.value) {
        clearKeyword()
      }
      if (data.fc === 0) {
        nav.push(data.cid)
      }
    }

    async function handleSort(
      order: Share.Base.Sorter['o'],
      asc: Share.Base.Sorter['asc'],
      fc_mix: Share.Base.Sorter['fc_mix'],
    ) {
      await explorer.changeSort(order, asc, fc_mix)
      explorer.page.changePage(1)
      explorer.refresh()
    }

    return () => (
      <div class="flex h-full flex-col">
        <DialogTitle title={props.title} class="pb-0!">
          {{
            actions: () => (
              <div class="flex items-center gap-2">
                <label
                  class="
                    input input-ghost bg-base-content/10
                    focus-within:bg-base-content/15
                    h-9 w-sm max-w-[60vw] rounded-full
                  "
                >
                  <Icon class="text-base-content/55 shrink-0 text-2xl" name={I.SEARCH} />
                  <input
                    class="grow bg-transparent text-sm"
                    value={keywordInput.value}
                    type="text"
                    placeholder="搜索目录"
                    onInput={e => keywordInput.value = (e.target as HTMLInputElement).value}
                    onKeyup={(e: KeyboardEvent) => {
                      if (e.key !== 'Enter')
                        return
                      keyword.value = keywordInput.value
                      if (props.keyword)
                        props.keyword.value = keywordInput.value
                    }}
                  />
                  {keywordInput.value && (
                    <button
                      class="btn btn-ghost btn-xs btn-circle h-6 min-h-6 w-6"
                      type="button"
                      title="清空搜索"
                      onClick={clearKeyword}
                    >
                      <Icon class="text-base-content/65 text-base" name={I.CLOSE} />
                    </button>
                  )}
                </label>
                <FileMenu class="relative z-10 shrink-0">
                  <FileNewFolderButton onClick={handleNewFolder}></FileNewFolderButton>
                  <FilePageSizeSelector
                    currentPageSize={explorer.page.size.value}
                    onChangePageSize={explorer.page.changeSize}
                  />
                  <FileSortSelector
                    asc={explorer.page.asc.value || 0}
                    fc_mix={explorer.page.fc_mix.value || 0}
                    order={explorer.page.order.value || 'user_ptime'}
                    onSort={handleSort}
                  />
                  <FileViewType
                    value={viewType.value}
                    onUpdateValue={(e: 'list' | 'card') => viewType.value = e}
                  />
                </FileMenu>
              </div>
            ),
          }}
        </DialogTitle>

        {/* header */}
        <div class={['border-base-content/10 sticky top-0 z-10 min-w-0 border-b px-6 py-2', viewType.value === 'card' && 'mb-5']}>
          <div class="mt-1 flex min-w-0 items-center gap-3">
            <div class="min-w-0 flex-1 overflow-hidden">
              <FilePath
                path={explorer.path.value ?? []}
                onPathClick={handleClickPath}
              />
            </div>
          </div>
        </div>

        <div ref={scrollRef} class="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <FileList
            viewType={viewType.value}
            class="
              pt-1
              data-[view-type=card]:gap-3!
              data-[view-type=card]:px-7
            "
            loading={explorer.list.loading.value}
            error={explorer.list.error.value ?? null}
            empty={!explorer.list.loading.value && (explorer.list.data.value?.data?.length ?? 0) === 0}
          >
            {(explorer.list.data.value?.data ?? []).map(item => (
              <FileItem
                class="data-[view-type=list]:px-6"
                key={item.pc}
                data={item}
                pathSelect={true}
                viewType={viewType.value}
                cid={source.cid.value}
                order={explorer.page.order.value}
                asc={explorer.page.asc.value}
                onClick={() => handleClickItem(item)}
                onContextmenu={(e: MouseEvent) => handleContextmenu(item, e)}
              >
                {{
                  thumbnail: (thumbnailProps: any) => (
                    <FileItemThumbnail {...thumbnailProps} />
                  ),
                }}
              </FileItem>
            ))}
            <FileContextMenu
              actionConfig={contextmenuActions.value}
              position={contextmenuPosition.value}
              show={contextmenuShow.value}
              onClose={() => contextmenuShow.value = false}
            />
          </FileList>

          {explorer.page.pageCount.value > 1 && (
            <div class="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 justify-center">
              <Pagination
                currentPage={explorer.page.page.value}
                currentPageSize={explorer.page.size.value}
                showSizeChanger={false}
                total={explorer.page.total.value}
                onCurrentPageChange={explorer.page.changePage}
                onPageSizeChange={explorer.page.changeSize}
              />
            </div>
          )}
        </div>
      </div>
    )
  },
})

export default FileBroswer
