import type { Share } from '@115master/drive115'
import { Button, FloatingDock, Header, HeaderEnd, HeaderStart, Pagination, SelectionHeader, Tooltip } from '@115master/ui'
import { breakpointsTailwind, useBreakpoints, useStorage, useTitle } from '@vueuse/core'
import { computed, defineComponent, onBeforeMount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppDialog } from '@/app/dialog'
import { router } from '@/app/router'
import {
  ActionBar,
  FileContextMenu,
  FileItem,
  FileList,
  FileNewFolderButton,
  FilePageSizeSelector,
  FilePath,
  FileSortSelector,
  FileViewType,
  Layout,
  Main,
  PageSizeOptions,
  ResponsiveMenu,
  Sider,
  SiderContent,
  SortOptions,
  useFilePreview,
  useFileSelection,
} from '@/components'
import { DndMonitor } from '@/components/Dnd'
import { PAGINATION_LABELS } from '@/constants'
import { useDriveAction } from '@/hooks/useDriveAction'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { I, Icon } from '@/icons'
import { useDriveStore } from '@/store/driveList'
import { getFilesItemId } from '@/utils/filesItem'
import { openFilesItem } from '@/utils/openFilesItem'
import { useDrivePageActions } from './useDrivePageActions'
import './drive.css'

const Drive = defineComponent({
  name: 'Drive',
  setup: () => {
    useTitle('115Master')

    const store = useDriveStore()
    const dialog = useAppDialog()
    const search = useGlobalSearch()
    const bp = useBreakpoints(breakpointsTailwind)
    const desktop = bp.greater('sm')
    const searchTooltip = computed(() => desktop.value ? '搜索 (⌘K)' : '搜索')
    const route = useRoute()
    const viewType = useStorage<'list' | 'card'>('115Master_drive_view_type', 'card')
    const items = computed(() => store.items)
    const isSearch = computed(() => store.nav.area === 'search')
    const paginated = computed(() => store.mode === 'pagination')
    const actions = useDrivePageActions(store, useDriveAction())

    function handleClickPath(data: Share.Entity.PathItem) {
      if (isSearch.value)
        return
      router.push({ name: 'drive', params: { cid: data.cid === '0' ? '' : data.cid } })
    }

    const mainRef = ref<{ el: HTMLElement | undefined } | null>(null)

    const { preview } = useFilePreview({
      get listData() { return items.value },
    })

    function openItem(item: Share.Entity.FilesItem) {
      return openFilesItem(item, {
        router,
        alert: opts => dialog.alert(opts),
        onPreview: preview,
      })
    }

    const {
      selectMode,
      allSelected,
      exitSelectMode,
      selectAll,
      contextmenuShow,
      contextmenuPosition,
      itemProps,
    } = useFileSelection({
      get items() { return items.value },
      get selected() { return store.selection.checked },
      set: store.selection.toggle,
      clear: store.selection.clear,
      onActivate: openItem,
      onDragMove: handleDragMove,
      container: () => mainRef.value?.el,
    })

    /** 拖拽移动：乐观退出多选，避免等待 API 期间多选头部闪现 */
    async function handleDragMove(cid: string, originItems: Share.Entity.FilesItem[]) {
      exitSelectMode()
      return actions.dragMove(cid, originItems)
    }

    const sorter = computed(() => ({
      asc: store.asc ?? 0,
      fc_mix: store.fc_mix ?? 0,
      order: store.order ?? 'user_ptime',
    }))
    const page = computed(() => ({
      currentPageSize: store.query.size,
      onChangePageSize: store.changeSize,
    }))

    function renderHeader(dragging: boolean) {
      // 拖拽期间冻结在多选头部之外：保住面包屑投放目标
      if (selectMode.value && !dragging) {
        return (
          <SelectionHeader
            count={store.selection.count}
            countLabel="项"
            exitLabel="退出多选"
            onExit={exitSelectMode}
            allSelected={allSelected.value}
            selectAllLabel="全选"
            onSelectAll={selectAll}
            v-slots={{
              exitIcon: () => <Icon class="text-xl" name={I.CLOSE} />,
              selectAllIcon: () => <Icon class="text-xl" name={I.SELECT_ALL} />,
            }}
          />
        )
      }
      return (
        <Header>
          <HeaderStart>
            <FilePath
              path={store.path ?? []}
              onDragMove={handleDragMove}
              onPathClick={handleClickPath}
            />
          </HeaderStart>
          <HeaderEnd>
            <Tooltip content={searchTooltip.value}>
              <Button variant="glass-floating" shape="circle" onClick={() => search.open()}>
                <Icon class="text-xl" name={I.SEARCH} />
              </Button>
            </Tooltip>
            {isSearch.value
              ? paginated.value && <FilePageSizeSelector {...page.value} />
              : (
                  <>
                    <div class="hidden @[480px]:inline-flex">
                      <FileNewFolderButton onClick={actions.newFolder} />
                    </div>
                    {paginated.value && (
                      <div class="hidden @[480px]:inline-flex">
                        <FilePageSizeSelector {...page.value} />
                      </div>
                    )}
                    <div class="hidden @[480px]:inline-flex">
                      <FileSortSelector {...sorter.value} onSort={store.changeSort} />
                    </div>
                  </>
                )}
            <FileViewType
              value={viewType.value}
              onUpdateValue={(e: 'list' | 'card') => viewType.value = e}
            />
            {!isSearch.value && (
              <div class="@[480px]:hidden">
                <ResponsiveMenu title="更多操作">
                  {{
                    target: (_props: object) => (
                      <Button variant="glass-floating" shape="circle" {..._props}>
                        <Icon class="text-xl" name={I.MORE} />
                      </Button>
                    ),
                    default: () => (
                      <>
                        <li>
                          <a tabindex="0" onClick={actions.newFolder}>
                            <Icon class="text-lg" name={I.NEW_FOLDER} />
                            <span class="ml-2">新建文件夹</span>
                          </a>
                        </li>
                        <li>
                          <details>
                            <summary>
                              <Icon class="text-lg" name={I.SORT} />
                              <span class="ml-2">排序</span>
                            </summary>
                            <ul>
                              <SortOptions {...sorter.value} onSort={store.changeSort} />
                            </ul>
                          </details>
                        </li>
                        {paginated.value && (
                          <li>
                            <details>
                              <summary>
                                <Icon class="text-lg" name={I.DOCUMENT} />
                                <span class="ml-2">每页</span>
                              </summary>
                              <ul>
                                <PageSizeOptions {...page.value} />
                              </ul>
                            </details>
                          </li>
                        )}
                      </>
                    ),
                  }}
                </ResponsiveMenu>
              </div>
            )}
          </HeaderEnd>
        </Header>
      )
    }

    function renderList(dragging: boolean) {
      return (
        <FileList
          class="
            pt-5
            pb-20
            data-[view-type=card]:px-5!
          "
          items={items.value}
          viewType={viewType.value}
          loading={store.loading}
          refreshing={store.refreshing}
          infinite={!paginated.value}
          hasMore={store.hasMore}
          loadingMore={store.loadingMore}
          loadMoreError={store.moreError}
          error={store.error ?? undefined}
          empty={!store.loading && store.total === 0}
          onLoadMore={store.loadMore}
        >
          {{
            item: ({ item, index }: { item: Share.Entity.FilesItem, index: number }) => (
              <FileItem
                class="data-[view-type=list]:px-(--main-content-gutter)"
                key={getFilesItemId(item)}
                index={index}
                setsize={items.value.length}
                viewType={viewType.value}
                selectMode={selectMode.value}
                cid={store.nav.cid}
                order={store.order}
                asc={store.asc}
                {...itemProps(item, dragging)}
                onPreview={() => preview(item)}
              />
            ),
            overlay: () => (
              <FileContextMenu
                actionConfig={actions.groups}
                position={contextmenuPosition.value}
                show={contextmenuShow.value}
                onClose={() => contextmenuShow.value = false}
              />
            ),
          }}
        </FileList>
      )
    }

    const bottomMode = computed(() => {
      if (selectMode.value && store.selection.count > 0)
        return 'actions'
      if (paginated.value && !store.loading && store.pageCount > 1)
        return 'pagination'
      return null
    })

    function renderBottom() {
      return (
        <div class="drive-bottom-dock ui-z-elevated pointer-events-none fixed right-0 bottom-[var(--drive-bottom-gap)] left-(--sider-width) flex items-center justify-center">
          <FloatingDock contentKey={bottomMode.value}>
            {bottomMode.value === 'actions'
              ? <ActionBar embedded groups={actions.groups} />
              : (
                  <Pagination
                    embedded
                    surface="floating"
                    currentPage={store.query.page}
                    currentPageSize={store.query.size}
                    showSizeChanger={false}
                    total={store.total}
                    labels={PAGINATION_LABELS}
                    onCurrentPageChange={store.changePage}
                    onPageSizeChange={store.changeSize}
                  />
                )}
          </FloatingDock>
        </div>
      )
    }

    // cid 变化时退出选择模式（清空选中 + 复位 Shift 锚点）
    watch(() => store.nav.cid, () => {
      exitSelectMode()
    })

    onBeforeMount(() => {
      if (route.query.offline_url)
        actions.cloudDownload(route.query.offline_url as string)
    })

    return () => (
      <DndMonitor>
        {{ default: ({ active }: { active: boolean }) => (
          <div
            class="drive-page flex h-full flex-col [--main-content-gutter:calc(var(--spacing)*3)] [--ui-header-gutter:var(--main-content-gutter)] sm:[--main-content-gutter:calc(var(--spacing)*6)]"
          >
            <Layout class="[--navbar-frosted-glass-height:var(--navbar-height)]">
              <Sider>
                <SiderContent />
              </Sider>
              <Main ref={mainRef} class="relative flex min-h-screen flex-col">
                {renderHeader(active)}
                {renderList(active)}
                {renderBottom()}
              </Main>
            </Layout>
          </div>
        ) }}
      </DndMonitor>
    )
  },
})

export default Drive
