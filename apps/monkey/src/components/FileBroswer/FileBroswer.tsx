import type { WebApi } from '@115master/drive115'
import type { Ref } from 'vue'
import type { NavSource } from '@/hooks/useDriveNav/types'
import type { Action } from '@/types/action'
import { useStorage } from '@vueuse/core'
import { computed, defineComponent, ref, shallowRef, watch } from 'vue'
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
  LoadingError,
  Pagination,
} from '@/components'
import { useDeleteAction } from '@/hooks/useDriveAction/useDeleteAction'
import { useFileAction } from '@/hooks/useDriveAction/useFileAction'
import { useDriveExplorer } from '@/hooks/useDriveExplorer'
import { useStackNav } from '@/hooks/useDriveNav'
import { ICON_DELETE, ICON_RENAME } from '@/icons'

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
    currentPathRef: {
      type: Object as () => Ref<Partial<WebApi.Entity.PathItem>[] | null>,
      required: false,
    },
    nav: {
      type: Object as () => NavSource & { push: (cid: string) => void },
      required: false,
    },
  },
  setup(props) {
    const nav = props.nav ?? useStackNav(props.defaultCid ?? '0')
    const scrollRef = ref<HTMLDivElement>()
    const hasExternalNav = !!props.nav
    const viewType = useStorage<'list' | 'card'>('115Master_file_browser_view_type', 'list')
    const explorer = useDriveExplorer({
      nav,
      page: ref(1),
      size: ref(20),
      nf: ref('1'),
      scroll: hasExternalNav,
      getScroll: () => scrollRef.value?.scrollTop ?? 0,
      setScroll: (top: number) => scrollRef.value?.scrollTo({ top, behavior: 'instant' }),
    })
    const { newFolder, renameItem } = useFileAction()
    const { deleteBatch } = useDeleteAction()
    const contextmenuShow = shallowRef(false)
    const contextmenuPosition = shallowRef({ x: 0, y: 0 })
    const contextmenuItem = shallowRef<WebApi.Entity.FilesItem | null>(null)

    function handleContextmenu(item: WebApi.Entity.FilesItem, e: MouseEvent) {
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
        { name: 'rename', label: '重命名', icon: ICON_RENAME, onClick: handleRename },
        { name: 'delete', label: '删除', icon: ICON_DELETE, onClick: handleDelete },
      ],
    ])

    // 同步 cid 到外部
    watch(nav.cid, (cid) => {
      props.cid.value = cid
    })

    // 同步路径到外部
    watch(explorer.path, (p) => {
      if (props.currentPathRef)
        props.currentPathRef.value = p
    }, { immediate: true })

    function handleClickPath(data: WebApi.Entity.PathItem) {
      nav.push(data.cid)
    }

    function handleClickItem(data: WebApi.Entity.FilesItem) {
      nav.push(data.cid)
    }

    async function handleSort(
      order: WebApi.Entity.Sorter['o'],
      asc: WebApi.Entity.Sorter['asc'],
      fc_mix: WebApi.Entity.Sorter['fc_mix'],
    ) {
      await explorer.changeSort(order, asc, fc_mix)
      explorer.page.changePage(1)
      explorer.refresh()
    }

    return () => (
      <div class="flex h-full flex-col">
        {/* header */}
        <div class="sticky top-0 z-10 flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1 overflow-hidden">
            <FilePath
              path={explorer.path.value ?? []}
              onPathClick={handleClickPath}
            />
          </div>

          <FileMenu class="shrink-0">
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

        <div ref={scrollRef} class="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {explorer.list.error.value && (
            <LoadingError
              class="absolute inset-0 m-auto"
              message={explorer.list.error.value}
              size="mini"
            />
          )}

          {explorer.list.loading.value && (
            <div class="loading loading-spinner loading-xl absolute inset-0 m-auto" />
          )}

          {!explorer.list.loading.value && explorer.list.data.value && (
            <>
              <FileList viewType={viewType.value}>
                {(explorer.list.data.value.data ?? []).map(item => (
                  <FileItem
                    key={item.pc}
                    data={item}
                    pathSelect={true}
                    viewType={viewType.value}
                    onClick={() => handleClickItem(item)}
                    onContextmenu={(e: MouseEvent) => handleContextmenu(item, e)}
                  >
                    {{
                      thumbnail: (thumbnailProps: any) => (
                        <FileItemThumbnail
                          {...thumbnailProps}
                          class="[&_span]:group-data-[view-type=card]:text-xl"
                        />
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
                <div class="sticky bottom-4 flex justify-center">
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
            </>
          )}
        </div>
      </div>
    )
  },
})

export default FileBroswer
