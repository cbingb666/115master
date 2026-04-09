import type { WebApi } from '@115master/drive115'
import type { Action } from '@/types/action'
import { Icon } from '@iconify/vue'
import { useStorage, useTitle } from '@vueuse/core'
import { computed, defineComponent, onBeforeMount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { router } from '@/app/router'
import {
  FileContextMenu,
  FileItem,
  FileList,
  FileMenu,
  FileNewFolderButton,
  FilePageSizeSelector,
  FilePath,
  FileSortSelector,
  FileViewType,
  Header,
  Layout,
  Main,
  Menu,
  Pagination,
  Sider,
  useFileList,
  useFilePreview,
} from '@/components'
import { useDriveAction } from '@/hooks/useDriveAction'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import {
  ICON_DELETE,
  ICON_FILE_IMPROVE,
  ICON_MOVE,
  ICON_RENAME,
  ICON_TOP,
  ICON_TOP_SOLID,
} from '@/icons'
import { useDriveStore } from '@/store/driveList'
import { useDriveSpaceInfoStore } from '@/store/driveSpaceInfo'
import { formatFileSize } from '@/utils/format'

const Drive = defineComponent({
  name: 'Drive',
  setup: () => {
    useTitle('115Master')

    const store = useDriveStore()
    const action = useDriveAction()
    const search = useGlobalSearch()
    const spaceInfo = useDriveSpaceInfoStore()
    const route = useRoute()
    const viewType = useStorage<'list' | 'card'>('115Master_drive_view_type', 'card')
    const isSearch = computed(() => store.nav.area === 'search')

    const actionHandlers = {
      newFolder: async () => {
        if (await action.newFolder(store.nav.cid))
          store.afterAction()
      },
      batchTop: async () => {
        if (await action.topBatch(store.selection.values))
          store.afterAction()
      },
      batchStar: async () => {
        if (await action.starBatch(store.selection.values))
          store.afterAction()
      },
      batchMove: async () => {
        const res = await action.moveBatch(store.nav.cid, store.selection.values)
        if (res.success)
          store.afterAction([res.pid])
      },
      improve: async () => {
        const pid = store.prevLevel?.cid ?? '0'
        if (await action.improve(store.selection.values, pid))
          store.afterAction([pid])
      },
      rename: async () => {
        if (await action.renameItem(store.selection.values[0]))
          store.afterAction()
      },
      batchDelete: async () => {
        if (await action.deleteBatch(store.nav.cid, store.selection.values))
          store.afterAction()
      },
      cloudDownload: async (defaultUrls: string = '') => {
        if (await action.cloudDownload(store.nav.cid, store.path, defaultUrls))
          store.afterAction()
      },
    }

    const actionAtom = {
      top: {
        name: 'top',
        label: '置顶',
        activeLabel: '取消置顶',
        icon: ICON_TOP,
        activeIcon: ICON_TOP_SOLID,
        activeIconColor: 'text-orange-500',
        active: computed(() => store.selection.values.some(item => item.is_top)),
        onClick: () => actionHandlers.batchTop(),
      },
      star: {
        name: 'star',
        label: '星标',
        activeLabel: '取消星标',
        icon: 'mdi:heart-outline',
        iconColor: 'text-pink-400',
        activeIcon: 'mdi:heart',
        activeIconColor: 'text-pink-400',
        active: computed(() => store.selection.values.some(item => item.m)),
        onClick: () => actionHandlers.batchStar(),
      },
      move: {
        name: 'move',
        label: '移动',
        icon: ICON_MOVE,
        onClick: () => actionHandlers.batchMove(),
      },
      improve: {
        name: 'improve',
        label: '提到上级',
        icon: ICON_FILE_IMPROVE,
        show: computed(() => store.prevLevel !== undefined),
        onClick: () => actionHandlers.improve(),
      },
      rename: {
        name: 'rename',
        label: '重命名',
        icon: ICON_RENAME,
        show: computed(() => store.selection.count === 1),
        onClick: () => actionHandlers.rename(),
      },
      delete: {
        name: 'delete',
        icon: ICON_DELETE,
        label: '删除',
        onClick: () => actionHandlers.batchDelete(),
      },
    } satisfies Record<string, Action>

    const actionConfig = computed<Action[][]>(() => [
      [actionAtom.top, actionAtom.star],
      [actionAtom.move, actionAtom.improve, actionAtom.rename],
      [actionAtom.delete],
    ])

    function handleClickPath(data: WebApi.Entity.PathItem) {
      if (isSearch.value)
        return
      router.push({ name: 'drive', params: { cid: data.cid === '0' ? '' : data.cid } })
    }

    async function handleSort(order: WebApi.Entity.Sorter['o'], asc: WebApi.Entity.Sorter['asc'], fc_mix: WebApi.Entity.Sorter['fc_mix']) {
      await store.changeSort(order, asc, fc_mix)
      store.page.changePage(1)
      store.refresh()
    }

    // function handleSearch(value: string) {
    //   router.push({ path: '/drive/search', query: { keyword: value } })
    // }

    async function handleDragMove(cid: string, originItems: WebApi.Entity.FilesItem[]) {
      const success = await action.dragMove(cid, originItems)
      if (success)
        store.afterAction([cid])
      return success
    }

    function SiderContent() {
      const value = computed(() => {
        const allUse = spaceInfo?.state?.data?.space_info?.all_use?.size ?? 0
        const allTotal = spaceInfo?.state?.data?.space_info?.all_total?.size ?? 1
        return (allUse / allTotal * 100).toFixed(2)
      })

      return (
        <>
          <div class="flex items-center justify-center pt-7 pb-4 text-xl font-bold tracking-tight font-stretch-expanded">
            115Master
          </div>
          <div class="bg-base-content/5 mb-4 h-px w-full" />
          <button
            class="btn btn-primary btn-glass"
            onClick={() => actionHandlers.cloudDownload()}
          >
            <Icon class="text-2xl" icon="material-symbols:add-link-rounded" />
            离线下载
          </button>
          <div class="bg-base-content/5 my-4 h-px w-full" />
          <Menu class="flex-1" />
          <div class="bg-base-content/5 my-4 h-px w-full" />
          <div class="mt-2 flex flex-none flex-col gap-2" v-show={spaceInfo.state?.state === true}>
            <div class="text-base-content/70 text-sm">
              {formatFileSize(spaceInfo?.state?.data?.space_info?.all_use?.size ?? 0)}
              {' / '}
              {formatFileSize(spaceInfo?.state?.data?.space_info?.all_total?.size ?? 0)}
            </div>
            <progress class="progress progress-lg progress-primary w-38" max={100} value={value.value} />
          </div>
          <div class="bg-base-content/5 my-4 h-px w-full" />
        </>
      )
    }

    const { containerRef, contextmenuShow, contextmenuPosition, itemProps } = useFileList({
      get pathSelect() { return false },
      get listData() { return store.list.data?.data ?? [] },
      get checkeds() { return store.selection.checked },
      onChecked: store.selection.toggle,
      onCheckedClear: store.selection.clear,
      onRadio: store.selection.radio,
      onDragMove: handleDragMove,
    })

    const { preview } = useFilePreview({
      get listData() { return store.list.data?.data ?? [] },
    })

    function ListHeader() {
      return (
        <Header>
          <div class="relative flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
            <FilePath
              path={store.path ?? []}
              onDragMove={handleDragMove}
              onPathClick={handleClickPath}
            />
          </div>
          <div class="flex flex-none items-center">
            <FileMenu>
              <button class="btn btn-sm btn-glass rounded-full" onClick={() => search.open()}>
                <Icon class="text-xl" icon="mdi:search" />
                <span class="hidden sm:inline">搜索</span>
              </button>
              {!isSearch.value && <FileNewFolderButton onClick={actionHandlers.newFolder} />}
              <FilePageSizeSelector
                currentPageSize={store.page.size}
                onChangePageSize={store.page.changeSize}
              />
              {!isSearch.value && (
                <FileSortSelector
                  asc={store.page.asc || 0}
                  fc_mix={store.page.fc_mix || 0}
                  order={store.page.order || 'user_ptime'}
                  onSort={handleSort}
                />
              )}
              <FileViewType
                value={viewType.value}
                onUpdateValue={(e: 'list' | 'card') => viewType.value = e}
              />
            </FileMenu>
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
          loading={store.list.loading}
          error={store.list.error?.message ?? undefined}
          empty={!store.list.loading && store.page.total === 0}
        >
          {store.list.data?.data?.map((item: WebApi.Entity.FilesItem) => (
            <FileItem
              class="data-[view-type=list]:px-3"
              key={item.pc}
              viewType={viewType.value}
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
      if (!store.list.loading && store.page.pageCount > 1) {
        return (
          <div class="fixed right-0 bottom-0 left-(--sider-width) flex justify-center">
            <div class="from-base-100/50 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent"></div>
            <div class="app-box-glass relative mb-4 rounded-full">
              <Pagination
                key="pagination"
                currentPage={store.page.page}
                currentPageSize={store.page.size}
                showSizeChanger={false}
                total={store.page.total}
                onCurrentPageChange={store.page.changePage}
                onPageSizeChange={store.page.changeSize}
              />
            </div>
          </div>
        )
      }
      return <></>
    }

    // cid 变化时清空选中
    watch(() => store.nav.cid, () => {
      store.selection.clear()
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
          <Main class="relative flex min-h-[calc(100vh-var(--navbar-height))] flex-col">
            <ListHeader />
            <List />
            <FixedBottom />
          </Main>
        </Layout>
      </div>
    )
  },
})

export default Drive
