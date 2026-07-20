import type { Share } from '@115master/drive115'
import type { Action } from '@/types/action'
import { useEventListener, useStorage, useTitle } from '@vueuse/core'
import { computed, defineComponent, onActivated, onBeforeMount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { router } from '@/app/router'
import {
  FileActionBar,
  FileContextMenu,
  FileItem,
  FileList,
  FileNewFolderButton,
  FilePageSizeSelector,
  FilePath,
  FileSortSelector,
  FileViewType,
  Header,
  Layout,
  Main,
  PageSizeOptions,
  Pagination,
  ResponsiveMenu,
  Sider,
  SiderContent,
  SortOptions,
  useDialog,
  useFileList,
  useFilePreview,
} from '@/components'
import { useDriveAction } from '@/hooks/useDriveAction'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { I, Icon } from '@/icons'
import { useDriveStore } from '@/store/driveList'
import { openFilesItem } from '@/utils/openFilesItem'

const Drive = defineComponent({
  name: 'Drive',
  setup: () => {
    useTitle('115Master')

    const store = useDriveStore()

    /** 离开 drive 路由：保存当前滚动位置（onBeforeRouteLeave 在卸载前触发，scrollY 仍准确） */
    onBeforeRouteLeave(() => store.saveScroll())
    /** 进入 drive：恢复滚动（onMounted 覆盖重挂载，onActivated 覆盖 keep-alive 复活） */
    onMounted(() => store.restoreScroll())
    onActivated(() => store.restoreScroll())

    const action = useDriveAction()
    const dialog = useDialog()
    const search = useGlobalSearch()
    const route = useRoute()
    const viewType = useStorage<'list' | 'card'>('115Master_drive_view_type', 'card')
    const isSearch = computed(() => store.nav.area === 'search')

    const actionHandlers = {
      newFolder: async () => {
        if (await action.newFolder(store.nav.cid))
          store.afterAction()
      },
      batchTop: async () => {
        if (await action.topBatch(store.selection.values)) {
          // 置顶影响服务端排序（is_top），本地不预测位置 → 整目录失效 + 刷新当前页
          store.invalidate('all', store.nav.cid || '0')
          store.afterAction()
        }
      },
      batchStar: async () => {
        const items = store.selection.values
        if (await action.starBatch(items))
          store.applyStarMutation(items)
      },
      batchMove: async () => {
        const items = store.selection.values
        const res = await action.moveBatch(store.nav.cid, items)
        if (res.success)
          store.applyRemoveMutation(items, res.pid)
      },
      improve: async () => {
        const pid = store.prevLevel?.cid ?? '0'
        const items = store.selection.values
        if (await action.improve(items, pid))
          store.applyRemoveMutation(items, pid)
      },
      rename: async () => {
        const item = store.selection.values[0]
        const newName = await action.renameItem(item)
        if (newName)
          store.applyUpdateMutation({ ...item, n: newName, ns: newName } as Share.Entity.FilesItem)
      },
      batchDelete: async () => {
        const items = store.selection.values
        if (await action.deleteBatch(store.nav.cid, items))
          store.applyRemoveMutation(items)
      },
      cloudDownload: async (defaultUrls: string = '') => {
        if (await action.cloudDownload(store.nav.cid, store.path, defaultUrls))
          store.afterAction()
      },
      batchTag: async () => {
        await action.tagBatch(store.selection.values)
      },
    }

    const actionAtom = {
      top: {
        name: 'top',
        label: '置顶',
        activeLabel: '取消置顶',
        icon: I.TOP,
        activeIcon: I.TOP_SOLID,
        activeIconColor: 'text-primary',
        active: computed(() => store.selection.values.some(item => item.is_top)),
        onClick: () => actionHandlers.batchTop(),
      },
      star: {
        name: 'star',
        label: '星标',
        activeLabel: '取消星标',
        icon: I.STAR,
        activeIcon: I.STAR_FILL,
        activeIconColor: 'text-primary',
        active: computed(() => store.selection.values.some(item => item.m)),
        onClick: () => actionHandlers.batchStar(),
      },
      move: {
        name: 'move',
        label: '移动',
        icon: I.MOVE,
        onClick: () => actionHandlers.batchMove(),
      },
      improve: {
        name: 'improve',
        label: '提到上级',
        icon: I.FILE_IMPROVE,
        show: computed(() => store.prevLevel !== undefined),
        onClick: () => actionHandlers.improve(),
      },
      rename: {
        name: 'rename',
        label: '重命名',
        icon: I.RENAME,
        show: computed(() => store.selection.count === 1),
        onClick: () => actionHandlers.rename(),
      },
      tag: {
        name: 'tag',
        label: '打标签',
        icon: I.TAG,
        onClick: () => actionHandlers.batchTag(),
      },
      delete: {
        name: 'delete',
        icon: I.DELETE,
        label: '删除',
        onClick: () => actionHandlers.batchDelete(),
      },
    } satisfies Record<string, Action>

    const actionConfig = computed<Action[][]>(() => [
      [actionAtom.top, actionAtom.star],
      [actionAtom.move, actionAtom.improve, actionAtom.rename, actionAtom.tag],
      [actionAtom.delete],
    ])

    function handleClickPath(data: Share.Entity.PathItem) {
      if (isSearch.value)
        return
      router.push({ name: 'drive', params: { cid: data.cid === '0' ? '' : data.cid } })
    }

    async function handleSort(order: Share.Base.Sorter['o'], asc: Share.Base.Sorter['asc'], fc_mix: Share.Base.Sorter['fc_mix']) {
      await store.changeSort(order, asc, fc_mix)
    }

    // function handleSearch(value: string) {
    //   router.push({ path: '/drive/search', query: { keyword: value } })
    // }

    async function handleDragMove(cid: string, originItems: Share.Entity.FilesItem[]) {
      const success = await action.dragMove(cid, originItems)
      if (success)
        store.applyRemoveMutation(originItems, cid)
      return success
    }

    const mainRef = ref<{ el: HTMLElement | undefined } | null>(null)

    const { preview } = useFilePreview({
      get listData() { return store.data?.data ?? [] },
    })

    function openItem(item: Share.Entity.FilesItem) {
      return openFilesItem(item, {
        router,
        alert: opts => dialog.alert(opts),
        onPreview: preview,
      })
    }

    const { containerRef, selectMode, exitSelectMode, contextmenuShow, contextmenuPosition, itemProps } = useFileList({
      get pathSelect() { return false },
      get listData() { return store.data?.data ?? [] },
      get checkeds() { return store.selection.checked },
      onChecked: store.selection.toggle,
      onCheckedClear: store.selection.clear,
      onOpen: openItem,
      onDragMove: handleDragMove,
      marqueeContainer: () => mainRef.value?.el,
    })

    function ListHeader() {
      const sorter: { asc: Share.Base.Sorter['asc'], fc_mix: Share.Base.Sorter['fc_mix'], order: Share.Base.Sorter['o'] } = {
        asc: store.asc || 0,
        fc_mix: store.fc_mix || 0,
        order: store.order || 'user_ptime',
      }
      const page = {
        currentPageSize: store.query.size,
        onChangePageSize: store.changeSize,
      }
      return (
        <Header>
          <div class="relative flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
            <FilePath
              path={store.path ?? []}
              onDragMove={handleDragMove}
              onPathClick={handleClickPath}
            />
          </div>
          <div class="flex flex-none items-center gap-2">
            <button class="btn btn-sm btn-glass rounded-full" onClick={() => search.open()}>
              <Icon class="text-xl" name={I.SEARCH} />
              <span class="hidden sm:inline">搜索</span>
            </button>
            {isSearch.value
              ? <FilePageSizeSelector {...page} />
              : (
                  <>
                    <div class="hidden @[480px]:inline-flex">
                      <FileNewFolderButton onClick={actionHandlers.newFolder} />
                    </div>
                    <div class="hidden @[480px]:inline-flex">
                      <FilePageSizeSelector {...page} />
                    </div>
                    <div class="hidden @[480px]:inline-flex">
                      <FileSortSelector {...sorter} onSort={handleSort} />
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
                      <button class="btn btn-sm btn-glass rounded-full" {..._props}>
                        <Icon class="text-xl" name={I.MORE} />
                      </button>
                    ),
                    default: () => (
                      <>
                        <li>
                          <a tabindex="0" onClick={actionHandlers.newFolder}>
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
                              <SortOptions {...sorter} onSort={handleSort} />
                            </ul>
                          </details>
                        </li>
                        <li>
                          <details>
                            <summary>
                              <Icon class="text-lg" name={I.DOCUMENT} />
                              <span class="ml-2">每页</span>
                            </summary>
                            <ul>
                              <PageSizeOptions {...page} />
                            </ul>
                          </details>
                        </li>
                      </>
                    ),
                  }}
                </ResponsiveMenu>
              </div>
            )}
          </div>
        </Header>
      )
    }

    function List() {
      return (
        <FileList
          class="
            pt-5
            pb-20
            data-[view-type=card]:px-5!
          "
          containerRef={containerRef}
          viewType={viewType.value}
          loading={store.loading}
          error={store.error ?? undefined}
          empty={!store.loading && store.total === 0}
        >
          {store.data?.data?.map((item: Share.Entity.FilesItem) => (
            <FileItem
              class="data-[view-type=list]:px-3"
              key={item.pc}
              viewType={viewType.value}
              selectMode={selectMode.value}
              cid={store.nav.cid}
              order={store.order}
              asc={store.asc}
              {...itemProps(item)}
              onPreview={() => preview(item)}
            />
          )) ?? []}
          <FileContextMenu
            actionConfig={actionConfig.value}
            position={contextmenuPosition.value}
            show={contextmenuShow.value}
            onClose={() => contextmenuShow.value = false}
          />
        </FileList>
      )
    }

    function FixedBottom() {
      if (!store.loading && store.pageCount > 1) {
        return (
          <div class="fixed right-0 bottom-0 left-(--sider-width) flex justify-center">
            <div class="from-base-100/50 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent"></div>
            <div class="app-box-glass relative mb-4 rounded-full">
              <Pagination
                key="pagination"
                currentPage={store.query.page}
                currentPageSize={store.query.size}
                showSizeChanger={false}
                total={store.total}
                onCurrentPageChange={store.changePage}
                onPageSizeChange={store.changeSize}
              />
            </div>
          </div>
        )
      }
      return <></>
    }

    // cid 变化时退出选择模式（清空选中 + 复位 Shift 锚点）
    watch(() => store.nav.cid, () => {
      exitSelectMode()
    })

    /** 点列表外空白退出选择模式；框选拖拽位移大时不退出（否则框选松开会清空刚选中的项） */
    let downX = 0
    let downY = 0
    useEventListener(() => containerRef.value, 'pointerdown', (e: PointerEvent) => {
      downX = e.clientX
      downY = e.clientY
    })
    useEventListener(() => containerRef.value, 'pointerup', (e: PointerEvent) => {
      if (!selectMode.value)
        return
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5)
        return
      if ((e.target as HTMLElement).closest('[data-selection-key]'))
        return
      exitSelectMode()
    })

    onBeforeMount(() => {
      if (route.query.offline_url)
        actionHandlers.cloudDownload(route.query.offline_url as string)
    })

    return () => (
      <div class="flex h-full flex-col">
        <Layout class="[--navbar-frosted-glass-height:var(--navbar-height)]">
          <Sider>
            <SiderContent />
          </Sider>
          <Main ref={mainRef} class="relative flex min-h-screen flex-col">
            <ListHeader />
            <List />
            <FixedBottom />
            {selectMode.value && (
              <FileActionBar
                data={store.selection.count > 0 ? actionConfig.value : []}
                onClose={exitSelectMode}
                count={store.selection.count}
              />
            )}
          </Main>
        </Layout>
      </div>
    )
  },
})

export default Drive
