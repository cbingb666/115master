import type { Share } from '@115master/drive115'
import type { Ref } from 'vue'
import type { NavSource } from '@/hooks/useDriveNav/types'
import type { Action } from '@/types/action'
import { Button, Tooltip } from '@115master/ui'
import { breakpointsTailwind, useBreakpoints, useStorage, watchDebounced } from '@vueuse/core'
import { computed, defineComponent, nextTick, ref, shallowRef, watch } from 'vue'
import {
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
import { useStackNav } from '@/hooks/useDriveNav'
import { I, Icon } from '@/icons'
import { useDrivePageList } from './useDrivePageList'

/** 文件浏览器内容组件 */
const FileBroswer = defineComponent({
  name: 'FileBroswer',
  props: {
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
    const viewType = useStorage<'list' | 'card'>('115Master_file_browser_view_type', 'list')

    /** 移动端搜索展开交互：默认仅搜索图标，点击后展开搜索框并 focus，同时隐藏操作按钮 */
    const breakpoints = useBreakpoints(breakpointsTailwind)
    const isMobile = breakpoints.smaller('sm')
    const searchExpanded = ref(false)
    const searchInputRef = ref<HTMLInputElement>()
    const source = {
      cid: computed(() => keyword.value.trim() ? '0' : nav.cid.value),
      area: computed(() => keyword.value.trim() ? 'search' : nav.area.value),
      direction: nav.direction,
    }
    const explorer = useDrivePageList({
      cid: source.cid,
      area: source.area,
      keyword,
      fc: 1,
      nf: ref('1'),
      size: 20,
    })

    // cid/area/keyword 变化 → 刷新
    watch([source.cid, source.area, keyword], () => {
      explorer.changePage(1)
      explorer.refresh()
    }, { immediate: true })
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
        explorer.applyCreate()
    }

    async function handleRename() {
      if (!contextmenuItem.value)
        return
      const item = contextmenuItem.value
      const newName = await renameItem(item)
      if (newName)
        explorer.applyUpdate({ ...item, n: newName, ns: newName } as Share.Entity.FilesItem)
    }

    async function handleDelete() {
      if (!contextmenuItem.value)
        return
      if (await deleteBatch(nav.cid.value || '0', [contextmenuItem.value]))
        explorer.applyRemove([contextmenuItem.value])
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

    /** 搜索默认收起为纯 icon 按钮，点击展开；移动端展开时隐藏操作按钮 */
    const showSearchBox = computed(() => searchExpanded.value)
    const showActions = computed(() => !isMobile.value || !searchExpanded.value)

    function expandSearch() {
      searchExpanded.value = true
      nextTick(() => searchInputRef.value?.focus())
    }
    function collapseSearch() {
      searchExpanded.value = false
      clearKeyword()
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
    }

    return () => (
      <div class="flex h-full flex-col">
        <div class="sticky top-0 z-10 flex justify-end px-6 pt-3">
          <div class="flex w-full items-center gap-2 sm:w-auto">
            {showSearchBox.value && (
              <label
                class={[
                  'input input-ghost bg-base-content/10 focus-within:bg-base-content/15 h-9 rounded-full',
                  isMobile.value ? 'flex-1' : 'w-sm max-w-[60vw]',
                ]}
              >
                <Icon class="text-base-content/55 shrink-0 text-2xl" name={I.SEARCH} />
                <input
                  ref={searchInputRef}
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
                  <Button
                    variant="ghost"
                    size="xs"
                    shape="circle"
                    title="清空搜索"
                    onClick={clearKeyword}
                  >
                    <Icon class="text-base-content/65 text-base" name={I.CLOSE} />
                  </Button>
                )}
              </label>
            )}

            {searchExpanded.value && (
              <Button
                variant="ghost"
                size="sm"
                class="shrink-0"
                onClick={collapseSearch}
              >
                取消
              </Button>
            )}

            {!searchExpanded.value && (
              <Tooltip content="搜索">
                <Button
                  variant="glass-floating"
                  shape="circle"
                  class="shrink-0"
                  onClick={expandSearch}
                >
                  <Icon class="text-xl" name={I.SEARCH} />
                </Button>
              </Tooltip>
            )}

            {showActions.value && (
              <FileMenu class="relative z-10 shrink-0">
                <FileNewFolderButton onClick={handleNewFolder}></FileNewFolderButton>
                <FilePageSizeSelector
                  currentPageSize={explorer.size.value}
                  onChangePageSize={explorer.changeSize}
                />
                <FileSortSelector
                  asc={explorer.asc.value || 0}
                  fc_mix={explorer.fc_mix.value || 0}
                  order={explorer.order.value || 'user_ptime'}
                  onSort={handleSort}
                />
                <FileViewType
                  value={viewType.value}
                  onUpdateValue={(e: 'list' | 'card') => viewType.value = e}
                />
              </FileMenu>
            )}
          </div>
        </div>

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
            loading={explorer.loading.value}
            error={explorer.error.value ?? null}
            empty={!explorer.loading.value && (explorer.data.value?.data?.length ?? 0) === 0}
          >
            {(explorer.data.value?.data ?? []).map(item => (
              <FileItem
                class="data-[view-type=list]:px-6"
                key={item.pc}
                data={item}
                pathSelect={true}
                viewType={viewType.value}
                cid={source.cid.value}
                order={explorer.order.value}
                asc={explorer.asc.value}
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

          {explorer.pageCount.value > 1 && (
            <div class="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 justify-center">
              <Pagination
                surface="floating"
                currentPage={explorer.page.value}
                currentPageSize={explorer.size.value}
                showSizeChanger={false}
                total={explorer.total.value}
                onCurrentPageChange={explorer.changePage}
                onPageSizeChange={explorer.changeSize}
              />
            </div>
          )}
        </div>
      </div>
    )
  },
})

export default FileBroswer
