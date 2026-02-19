import type { WebApi } from '@115master/drive115'
import type { Action } from '@/types/action'
import { Icon } from '@iconify/vue'
import { useStorage, useTitle } from '@vueuse/core'
import { computed, defineComponent, onBeforeMount, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { router } from '@/app/router'
import {
  DriveSearchBar,
  Empty,
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
  LoadingError,
  Main,
  Menu,
  Navbar,
  Pagination,
  Sider,
  useFileList,
  useFilePreview,
  UserInfo,
} from '@/components'
import { useDriveAction } from '@/hooks/useDriveAction'
import {
  ICON_CANCEL,
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
    const spaceInfo = useDriveSpaceInfoStore()
    const route = useRoute()

    const searchKeyword = shallowRef('')

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

    const actionAtom: Record<string, Action> = {
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
      cancel: {
        name: 'cancel',
        icon: ICON_CANCEL,
        label: '取消选择',
        onClick: () => store.selection.clear(),
      },
    }

    const actionConfig = computed<Action[][]>(() => [
      [actionAtom.top, actionAtom.star],
      [actionAtom.move, actionAtom.improve, actionAtom.rename],
      [actionAtom.delete],
      [actionAtom.cancel],
    ])

    function handleClickPath(data: WebApi.Entity.PathItem) {
      router.push({ name: 'drive', params: { cid: data.cid === '0' ? '' : data.cid } })
    }

    async function handleSort(order: WebApi.Entity.Sorter['o'], asc: WebApi.Entity.Sorter['asc'], fc_mix: WebApi.Entity.Sorter['fc_mix']) {
      await store.changeSort(order, asc, fc_mix)
      store.page.changePage(1)
      store.refresh()
    }

    function handleSearch(value: string) {
      router.push({ path: '/drive/search', query: { keyword: value } })
    }

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
          <div class="flex h-(--navbar-height) items-center justify-center text-2xl font-bold tracking-tight font-stretch-expanded">
            115Master
          </div>
          <button
            class="btn btn-md btn-primary btn-soft btn-text flex-none rounded-full px-6"
            onClick={() => actionHandlers.cloudDownload()}
          >
            <Icon class="text-2xl" icon="material-symbols:add-link-rounded" />
            离线下载
          </button>
          <div class="mt-5 flex-1">
            <Menu class="flex-1" />
          </div>
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

    const viewType = useStorage<'list' | 'card'>('115Master_viewType', 'list')

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
          <div class="relative flex items-center gap-4">
            <FilePath
              path={store.path ?? []}
              onDragMove={handleDragMove}
              onPathClick={handleClickPath}
            />
          </div>
          <div class="flex items-center">
            <FileMenu>
              <FileNewFolderButton onClick={actionHandlers.newFolder} />
              <FilePageSizeSelector
                currentPageSize={store.page.size}
                onChangePageSize={store.page.changeSize}
              />
              <FileSortSelector
                asc={store.page.asc || 0}
                fc_mix={store.page.fc_mix || 0}
                order={store.page.order || 'user_ptime'}
                onSort={handleSort}
              />
              <FileViewType
                value={viewType.value}
                onUpdateValue={(e: 'list' | 'card') => viewType.value = e}
              />
            </FileMenu>
          </div>
        </Header>
      )
    }

    function ListState() {
      if (store.list.error)
        return <LoadingError class="absolute inset-0 m-auto" message={store.list.error} size="mini" />
      if (store.list.loading)
        return <div class="loading loading-spinner loading-xl absolute inset-0 m-auto" />
      if (!store.list.loading && store.page.total === 0)
        return <Empty class="absolute inset-0 m-auto" description="没有文件" />
      return <></>
    }

    function List() {
      return (
        <>
          {!store.list.error && store.list.data?.data && (
            <FileList containerRef={containerRef} viewType={viewType.value}>
              {store.list.data.data.map((item: WebApi.Entity.FilesItem) => (
                <FileItem
                  key={item.pc}
                  viewType={viewType.value}
                  {...itemProps(item)}
                  onPreview={() => preview(item)}
                />
              ))}
              <FileContextMenu
                actionConfig={actionConfig.value}
                position={contextmenuPosition.value}
                show={contextmenuShow.value}
                onClose={() => contextmenuShow.value = false}
              />
            </FileList>
          )}
        </>
      )
    }

    function FixedBottom() {
      if (!store.list.loading && store.page.pageCount > 1) {
        return (
          <Pagination
            key="pagination"
            class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
            currentPage={store.page.page}
            currentPageSize={store.page.size}
            showSizeChanger={false}
            total={store.page.total}
            onCurrentPageChange={store.page.changePage}
            onPageSizeChange={store.page.changeSize}
          />
        )
      }
      return <></>
    }

    watch(() => route.query.keyword, (value) => {
      searchKeyword.value = value as string
    }, { immediate: true })

    // cid 变化时清空选中
    watch(() => store.nav.cid, () => {
      store.selection.clear()
    })

    onBeforeMount(() => {
      if (route.query.offline_url)
        actionHandlers.cloudDownload(route.query.offline_url as string)
    })

    return () => (
      <div class="flex h-full flex-col [--drive-header-height:calc(var(--spacing)*12)]">
        <Layout class="[--navbar-frosted-glass-height:var(--navbar-height)]">
          <Navbar>
            {{
              default: () => (
                <DriveSearchBar modelValue={searchKeyword.value} onEnter={handleSearch} />
              ),
              right: () => <UserInfo />,
            }}
          </Navbar>
          <Sider>
            <SiderContent />
          </Sider>
          <Main class="relative flex min-h-[calc(100vh-var(--navbar-height))] flex-col">
            <ListHeader />
            <ListState />
            <List />
            <FixedBottom />
          </Main>
        </Layout>
      </div>
    )
  },
})

export default Drive
