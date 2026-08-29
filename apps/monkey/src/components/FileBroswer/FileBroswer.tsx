import type { Share } from '@115master/drive115'
import type { ActionMenuGroup } from '@115master/ui'
import type { Ref } from 'vue'
import type { NavSource } from '@/hooks/useDriveNav/types'
import { ActionMenu, Button, Pagination, Pill, scrollbar, Tooltip } from '@115master/ui'
import { breakpointsTailwind, useBreakpoints, useStorage, watchDebounced } from '@vueuse/core'
import { computed, defineComponent, nextTick, ref, shallowRef, watch } from 'vue'
import {
  FileItem,
  FileItemThumbnail,
  FileList,
  FileMenu,
  FileNewFolderButton,
  FilePageSizeSelector,
  FilePath,
  FileSortSelector,
  FileViewType,
} from '@/components'
import { PAGINATION_LABELS } from '@/constants'
import { useDeleteAction } from '@/hooks/useDriveAction/useDeleteAction'
import { useFileAction } from '@/hooks/useDriveAction/useFileAction'
import { useDriveList } from '@/hooks/useDriveList'
import { useStackNav } from '@/hooks/useDriveNav'
import { I, Icon } from '@/icons'
import { actionIcon } from '@/utils/action'
import { getFilesItemId } from '@/utils/filesItem'
import './FileBroswer.css'

type ThumbnailProps = InstanceType<typeof FileItemThumbnail>['$props']

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
    page: {
      type: Object as () => Ref<number>,
      required: false,
    },
    size: {
      type: Object as () => Ref<number>,
      required: false,
    },
    total: {
      type: Object as () => Ref<number>,
      required: false,
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
    const getScrollElement = () => scrollRef.value
    const viewType = useStorage<'list' | 'card'>('115Master_file_browser_view_type', 'list')

    /** 移动端搜索展开交互：默认仅搜索图标，点击后展开搜索框并 focus，同时隐藏操作按钮 */
    const breakpoints = useBreakpoints(breakpointsTailwind)
    const isMobile = breakpoints.smaller('sm')
    const searchExpanded = ref(false)
    const searchInputRef = ref<HTMLInputElement>()
    const source = {
      cid: computed(() => keyword.value.trim() ? '0' : nav.cid.value),
      area: computed(() => keyword.value.trim() ? 'search' : nav.area.value),
    }
    const page = props.page ?? shallowRef(1)
    const size = props.size ?? shallowRef(20)
    const explorer = useDriveList({
      source: {
        cid: source.cid,
        area: source.area,
        search: computed(() => !!keyword.value.trim()),
      },
      page,
      size,
      filter: { keyword, fc: 1, nf: '1' },
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
        await explorer.refresh()
    }

    async function handleRename() {
      if (!contextmenuItem.value)
        return
      const item = contextmenuItem.value
      const newName = await renameItem(item)
      if (newName)
        await explorer.refresh()
    }

    async function handleDelete() {
      if (!contextmenuItem.value)
        return
      if (await deleteBatch(nav.cid.value || '0', [contextmenuItem.value]))
        await explorer.refresh()
    }

    const contextmenuActions = computed<ActionMenuGroup[]>(() => [
      [
        { id: 'rename', label: '重命名', leading: actionIcon(I.RENAME), onSelect: handleRename },
        { id: 'delete', label: '删除', leading: actionIcon(I.DELETE), onSelect: handleDelete },
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

    watch(explorer.total, (total) => {
      if (props.total)
        props.total.value = total
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

    function pager() {
      return (
        <Pagination
          currentPage={page.value}
          currentPageSize={size.value}
          showSizeChanger={false}
          total={explorer.total.value}
          labels={PAGINATION_LABELS}
          onCurrentPageChange={explorer.changePage}
          onPageSizeChange={explorer.changeSize}
        />
      )
    }

    return () => (
      <div class="flex h-full flex-col">
        <div
          ref={scrollRef}
          class={[...scrollbar(), 'relative flex min-h-0 flex-1 flex-col overflow-y-auto']}
          data-file-browser-scroll
        >
          <header class="file-browser__header">
            <div
              class="flex items-center gap-4 px-6 pt-5"
              data-file-browser-toolbar
            >
              <h2
                class={[
                  'min-w-0 flex-1 truncate text-lg leading-[1.4] font-semibold',
                  isMobile.value && searchExpanded.value && 'hidden',
                ]}
              >
                {props.title}
              </h2>

              <div
                class={[
                  'ml-auto flex min-w-0 items-center gap-2',
                  isMobile.value && searchExpanded.value ? 'flex-1' : 'shrink-0',
                ]}
              >
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
                  <FileMenu class="ui-z-elevated relative shrink-0">
                    <FileNewFolderButton onClick={handleNewFolder}></FileNewFolderButton>
                    <FilePageSizeSelector
                      currentPageSize={size.value}
                      onChangePageSize={explorer.changeSize}
                    />
                    <FileSortSelector
                      asc={explorer.asc.value || 0}
                      fc_mix={explorer.fcMix.value || 0}
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

            <div
              class={[
                'min-w-0 px-6 py-2',
                viewType.value === 'card' && 'mb-5',
              ]}
              data-file-browser-path
            >
              <div class="flex min-w-0 items-center gap-3">
                <div class="min-w-0 flex-1 overflow-hidden">
                  <FilePath
                    floating
                    path={explorer.path.value ?? []}
                    size="sm"
                    onPathClick={handleClickPath}
                  />
                </div>
              </div>
            </div>
          </header>

          <FileList
            items={explorer.items.value}
            getScrollElement={getScrollElement}
            viewType={viewType.value}
            class="
              shrink-0 pt-1 pb-24
              data-[view-type=card]:mt-5
              data-[view-type=card]:gap-3!
              data-[view-type=card]:px-7
            "
            loading={explorer.loading.value}
            refreshing={explorer.refreshing.value}
            error={explorer.error.value ?? null}
            empty={!explorer.loading.value && explorer.items.value.length === 0}
          >
            {{
              item: ({ item, index }: { item: Share.Entity.FilesItem, index: number }) => (
                <FileItem
                  class="data-[view-type=list]:px-6"
                  key={getFilesItemId(item)}
                  data={item}
                  index={index}
                  setsize={explorer.items.value.length}
                  pathSelect={true}
                  viewType={viewType.value}
                  cid={source.cid.value}
                  order={explorer.order.value}
                  asc={explorer.asc.value}
                  onClick={() => handleClickItem(item)}
                  onContextmenu={(e: MouseEvent) => handleContextmenu(item, e)}
                >
                  {{
                    thumbnail: (thumbnailProps: ThumbnailProps) => (
                      <FileItemThumbnail {...thumbnailProps} />
                    ),
                  }}
                </FileItem>
              ),
              overlay: () => (
                <ActionMenu
                  aria-label="文件操作"
                  groups={contextmenuActions.value}
                  open={contextmenuShow.value}
                  position={contextmenuPosition.value}
                  onUpdate:open={open => contextmenuShow.value = open}
                />
              ),
            }}
          </FileList>

          {isMobile.value && explorer.pageCount.value > 1 && (
            <div
              class="file-browser__bottom ui-z-elevated sticky bottom-0 flex shrink-0 justify-center px-4 py-4"
              data-file-browser-pagination
            >
              <Pill as="div" variant="glass-floating" size="sm" class="h-auto p-1">
                {pager()}
              </Pill>
            </div>
          )}
        </div>
      </div>
    )
  },
})

export default FileBroswer
