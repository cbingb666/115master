import type { Share } from '@115master/drive115'
import type { Action } from '@/types/action'
import { Button, Tooltip } from '@115master/ui'
import { breakpointsTailwind, useBreakpoints, useEventListener, useStorage, useTitle } from '@vueuse/core'
import { computed, defineComponent, onActivated, onBeforeMount, onMounted, ref, Transition, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
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
  Header,
  HeaderEnd,
  HeaderStart,
  Layout,
  Main,
  PageSizeOptions,
  Pagination,
  ResponsiveMenu,
  SelectionHeader,
  Sider,
  SiderContent,
  SortOptions,
  useFileList,
  useFilePreview,
} from '@/components'
import { DndMonitor } from '@/components/Dnd'
import { useDriveAction } from '@/hooks/useDriveAction'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { I, Icon } from '@/icons'
import { useDriveStore } from '@/store/driveList'
import { openFilesItem } from '@/utils/openFilesItem'
import './drive.css'

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
    const dialog = useAppDialog()
    const search = useGlobalSearch()
    const bp = useBreakpoints(breakpointsTailwind)
    const searchTooltip = computed(() => bp.greater('sm').value ? '搜索 (⌘K)' : '搜索')
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
      [actionAtom.top, actionAtom.star, actionAtom.tag],
      [actionAtom.move, actionAtom.improve, actionAtom.rename],
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

    /** 拖拽移动：乐观退出多选，避免等待 API 期间多选头部闪现 */
    async function handleDragMove(cid: string, originItems: Share.Entity.FilesItem[]) {
      exitSelectMode()
      const success = await action.dragMove(cid, originItems)
      if (success)
        store.applyRemoveMutation(originItems, cid)
      return success
    }

    function ListHeader(dragging: boolean) {
      // 拖拽期间冻结在多选头部之外：保住面包屑投放目标
      if (selectMode.value && !dragging) {
        return (
          <SelectionHeader
            count={store.selection.count}
            onExit={exitSelectMode}
            onInvert={() => store.selection.invert(store.data?.data ?? [])}
            onSelectAll={() => store.selection.selectAll(store.data?.data ?? [])}
          />
        )
      }
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
                      <Button variant="glass-floating" shape="circle" {..._props}>
                        <Icon class="text-xl" name={I.MORE} />
                      </Button>
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
          </HeaderEnd>
        </Header>
      )
    }

    function List(dragging: boolean) {
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
              {...itemProps(item, dragging)}
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

    const bottomMode = computed<'actions' | 'pagination' | null>(() => {
      if (selectMode.value && store.selection.count > 0)
        return 'actions'
      if (!store.loading && store.pageCount > 1)
        return 'pagination'
      return null
    })

    function FixedBottom() {
      return (
        <div class="drive-bottom-dock ui-z-elevated pointer-events-none fixed right-0 bottom-[var(--drive-bottom-gap)] left-(--sider-width) flex justify-center">
          <Transition
            mode="out-in"
            enterActiveClass="motion-reduce:transition-none transition-[transform,opacity] duration-[180ms] ease-out"
            enterFromClass="translate-y-4 opacity-0"
            enterToClass="translate-y-0 opacity-100"
            leaveActiveClass="pointer-events-none motion-reduce:transition-none transition-[transform,opacity] duration-[140ms] ease-in"
            leaveFromClass="translate-y-0 opacity-100"
            leaveToClass="translate-y-4 opacity-0"
          >
            {bottomMode.value === 'actions'
              ? (
                  <div key="actions" class="pointer-events-auto">
                    <ActionBar groups={actionConfig.value} />
                  </div>
                )
              : bottomMode.value === 'pagination'
                ? (
                    <div key="pagination" class="pointer-events-auto">
                      <Pagination
                        surface="floating"
                        currentPage={store.query.page}
                        currentPageSize={store.query.size}
                        showSizeChanger={false}
                        total={store.total}
                        onCurrentPageChange={store.changePage}
                        onPageSizeChange={store.changeSize}
                      />
                    </div>
                  )
                : null}
          </Transition>
        </div>
      )
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
      <DndMonitor>
        {{ default: ({ active }: { active: boolean }) => (
          <div
            class="flex h-full flex-col"
            style={{
              '--drive-floating-gap': 'calc(var(--spacing) * 2)',
              '--drive-floating-content-gap': 'calc(var(--drive-floating-gap) + var(--spacing) * 3)',
              '--drive-bottom-gap': 'calc(env(safe-area-inset-bottom) + var(--drive-floating-content-gap))',
            }}
          >
            <Layout class="[--navbar-frosted-glass-height:var(--navbar-height)]">
              <Sider>
                <SiderContent />
              </Sider>
              <Main ref={mainRef} class="relative flex min-h-screen flex-col">
                {ListHeader(active)}
                {List(active)}
                <FixedBottom />
              </Main>
            </Layout>
          </div>
        ) }}
      </DndMonitor>
    )
  },
})

export default Drive
