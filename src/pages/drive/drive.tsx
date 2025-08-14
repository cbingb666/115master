import type { Action } from '@/types/action'
import type { WebApi } from '@/utils/drive115/api'
import { Icon } from '@iconify/vue'
import { useStorage, useTitle } from '@vueuse/core'
import { useRouteParams, useRouteQuery } from '@vueuse/router'
import { computed, defineComponent, onBeforeMount, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { router } from '@/app/router'
import { DriveSearchBar, Empty, FileList, FileMenu, FileNewFolderButton, FilePageSizeSelector, FilePaths, FileSortSelector, Header, Layout, LoadingError, Main, Menu, Navbar, Pagination, Sider } from '@/components'
import { FileViewType } from '@/components/FileViewType'
import UserInfo from '@/components/Layout/Navbar/UserInfo.vue'
import { PAGINATION_DEFAULT_PAGE_SIZE } from '@/constants'
import { useDriveAction } from '@/hooks/useDriveAction'
import { useDriveFile } from '@/hooks/useDriveFile'
import { ICON_CANCEL, ICON_DELETE, ICON_FILE_UP, ICON_MOVE, ICON_RENAME, ICON_TOP, ICON_TOP_SOLID } from '@/icons'
import { useDriveSpaceInfoStore } from '@/store/driveSpaceInfo'
import { clsx } from '@/utils/clsx'
import { formatFileSize } from '@/utils/format'

const styles = clsx({
  brand: [
    'text-2xl',
    'font-bold',
    'font-stretch-expanded',
    'tracking-tight',
    'h-[var(--navbar-height)]',
    'flex items-center justify-center',
  ],
  // 容器样式
  container: {
    root: [
      'flex flex-col h-full',
      '[--drive-header-height:calc(var(--spacing)*12)]',
    ],
    layout: [
      '[--navbar-frosted-glass-height:var(--navbar-height)]',
    ],
    main: [
      'relative',
      'flex flex-col',
      'min-h-[calc(100vh-var(--navbar-height))]',
    ],
  },

  // 侧边栏样式
  sider: {
    downloadBtn: [
      'btn btn-md btn-primary rounded-full btn-soft btn-text px-6 flex-none',
    ],
    menuContainer: [
      'flex-1 mt-5',
    ],
    menu: [
      'flex-1',
    ],
    divider: [
      'h-px w-full bg-base-content/5 my-4',
    ],
  },

  // 图标样式
  icon: {
    large: [
      'text-2xl',
    ],
  },

  // 内容区域样式
  content: {
    empty: [
      'absolute inset-0 m-auto',
    ],
    loadingContainer: [
      'absolute inset-0 m-auto',
      'loading loading-spinner loading-xl',
    ],
    fileList: [
      // 文件列表容器样式
    ],
  },

  // 空间信息样式
  spaceInfo: {
    container: [
      'mt-2 flex-none flex flex-col gap-2',
    ],
    text: [
      'text-sm text-base-content/70',
    ],
    progress: [
      'progress progress-lg w-38 progress-primary',
    ],
  },

  // 状态样式
  state: {
    posCenter: [
      'absolute inset-0 m-auto',
    ],
    pagination: [
      'fixed',
      'left-1/2',
      '-translate-x-1/2',
      'bottom-4',
      'z-50',
    ],
  },

  // 头部样式
  header: {
    pathContainer: [
      'relative',
      'flex',
      'items-center',
      'gap-4',
    ],
    menuContainer: [
      'flex',
      'items-center',
    ],
  },
})

const Drive = defineComponent({
  name: 'Drive',
  setup: () => {
    useTitle('115Master')

    const query = {
      suffix: useRouteQuery('suffix', ''),
      type: useRouteQuery('type', ''),
      cid: useRouteParams<string>('cid'),
      area: useRouteParams<string>('area', 'all'),
      page: useRouteQuery<number>('page', 1, {
        transform: Number,
      }),
      size: useStorage('115Master_pageSize', PAGINATION_DEFAULT_PAGE_SIZE),
      keyword: useRouteQuery<string>('keyword', '', {
        mode: 'push',
      }),
    }

    const searchKeyword = shallowRef('')

    const action = useDriveAction()

    const spaceInfo = useDriveSpaceInfoStore()

    const listStore = useDriveFile(query)

    const withRefresh = <T extends (...args: any[]) => Promise<boolean>>(fn: T) => {
      return async (...args: any[]) => {
        const success = await fn(...args)
        if (success) {
          listStore.refresh()
          listStore.itemChecked.clearAllChecked()
        }
      }
    }

    const actionHandlers = {
      newFolder: withRefresh(() => action.newFolder(
        listStore.options.cid.value,
      )),
      batchTop: withRefresh(() => action.topBatch(
        listStore.itemChecked.checkedValues.value,
      )),
      batchStar: withRefresh(() => action.starBatch(
        listStore.itemChecked.checkedValues.value,
      )),
      batchMove: withRefresh(() => action.moveBatch(
        listStore.options.cid.value,
        listStore.itemChecked.checkedValues.value,
      )),
      fileUp: withRefresh(() => action.fileUp(
        listStore.itemChecked.checkedValues.value,
        listStore.prevLevelPath.value?.cid ?? '0',
      )),
      rename: withRefresh(() => action.renameItem(
        listStore.itemChecked.checkedValues.value[0],
      )),
      batchDelete: withRefresh(() => action.deleteBatch(
        listStore.options.cid.value,
        listStore.itemChecked.checkedValues.value,
      )),
      cloudDownload: withRefresh((defaultUrls: string = '') => action.cloudDownload(
        listStore.options.cid.value,
        defaultUrls,
      )),
    }

    const actionAtom: Record<string, Action> = {
      top: {
        name: 'top',
        label: '置顶',
        activeLabel: '取消置顶',
        icon: ICON_TOP,
        activeIcon: ICON_TOP_SOLID,
        activeIconColor: clsx('text-orange-500'),
        active: computed(() => listStore.itemChecked.checkedValues.value.some(item => item.is_top)),
        onClick: () => actionHandlers.batchTop(),
      },
      star: {
        name: 'star',
        label: '星标',
        activeLabel: '取消星标',
        icon: 'mdi:heart-outline',
        iconColor: clsx('text-pink-400'),
        activeIcon: 'mdi:heart',
        activeIconColor: clsx('text-pink-400'),
        active: computed(() => listStore.itemChecked.checkedValues.value.some(item => item.m)),
        onClick: () => actionHandlers.batchStar(),
      },
      move: {
        name: 'move',
        label: '移动',
        icon: ICON_MOVE,
        onClick: () => {
          actionHandlers.batchMove()
        },
      },
      fileUp: {
        name: 'fileUp',
        label: '提到上级',
        icon: ICON_FILE_UP,
        show: computed(() => listStore.prevLevelPath.value !== undefined),
        onClick: () => {
          actionHandlers.fileUp()
        },
      },
      rename: {
        name: 'rename',
        label: '重命名',
        icon: ICON_RENAME,
        show: computed(() => listStore.itemChecked.checkedCount.value === 1),
        onClick: () => {
          actionHandlers.rename()
        },
      },
      delete: {
        name: 'delete',
        icon: ICON_DELETE,
        label: '删除',
        onClick: () => {
          actionHandlers.batchDelete()
        },
      },
      cancel: {
        name: 'cancel',
        icon: ICON_CANCEL,
        label: '取消选择',
        onClick: () => {
          listStore.itemChecked.clearAllChecked()
        },
      },
    }

    const actionConfig = computed<
      Action[][]
    >(() => {
      return [
        [actionAtom.top, actionAtom.star],
        [actionAtom.move, actionAtom.fileUp, actionAtom.rename],
        [actionAtom.delete],
        [actionAtom.cancel],
      ]
    })

    function handleClickPath(data: WebApi.Res.Files['path'][number]) {
      router.push({
        params: {
          area: 'all',
          cid: data.cid,
        },
      })
    }

    function handleSort(order: WebApi.Entity.Sorter['o'], asc: WebApi.Entity.Sorter['asc'], fc_mix: WebApi.Entity.Sorter['fc_mix']) {
      listStore.sorter.change(order, asc, fc_mix)
    }

    function handleSearch(value: string) {
      router.push({
        path: '/drive/search',
        query: {
          keyword: value,
        },
      })
    }

    async function handleDragMove(cid: string, originItems: WebApi.Entity.FilesItem[]) {
      const success = await action.dragMove(cid, originItems)
      if (success) {
        listStore.refresh()
        listStore.itemChecked.clearAllChecked()
      }
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
          <div class={styles.brand}>
            115Master
          </div>
          {/* 离线下载 */}
          <button
            class={styles.sider.downloadBtn}
            onClick={() => actionHandlers.cloudDownload()}
          >
            <Icon
              class={styles.icon.large}
              icon="material-symbols:add-link-rounded"
            />
            离线下载
          </button>

          <div class={styles.sider.menuContainer}>
            {/* 菜单 */}
            <Menu class={styles.sider.menu} />
          </div>

          {/* 空间信息 */}
          <div class={styles.spaceInfo.container} v-show={spaceInfo.state?.state === true}>
            <div class={styles.spaceInfo.text}>
              { formatFileSize(spaceInfo?.state?.data?.space_info?.all_use?.size ?? 0) }
              {' / '}
              { formatFileSize(spaceInfo?.state?.data?.space_info?.all_total?.size ?? 0) }
            </div>
            <progress
              class={styles.spaceInfo.progress}
              max={100}
              value={value.value}
            />
          </div>

          <div class={styles.sider.divider} />
        </>
      )
    }

    const viewType = useStorage<'list' | 'card'>('115Master_viewType', 'list')

    function ListHeader() {
      return (
        <Header>
          <div class={styles.header.pathContainer}>
            <FilePaths
              paths={listStore.path.value ?? []}
              onDragMove={handleDragMove}
              onPathClick={handleClickPath}
            />
          </div>

          <div class={styles.header.menuContainer}>
            <FileMenu>
              <FileNewFolderButton onClick={actionHandlers.newFolder} />
              <FilePageSizeSelector
                currentPageSize={listStore.pagination.state.size}
                onChangePageSize={listStore.pagination.changeSize}
              />
              <FileSortSelector
                asc={listStore.sorter.state.asc || 0}
                fc_mix={listStore.sorter.state.fc_mix || 0}
                order={listStore.sorter.state.order || 'user_ptime'}
                onSort={(order, asc, fc_mix) => handleSort(order, asc, fc_mix)}
              />
              <FileViewType
                value={viewType.value}
                onUpdateValue={e => viewType.value = e}
              />
            </FileMenu>
          </div>
        </Header>
      )
    }

    function ListState() {
      if (listStore.list.error.value) {
        return (
          <LoadingError
            class={styles.state.posCenter}
            message={listStore.list.error.value}
            size="mini"
          />
        )
      }

      if (listStore.list.isLoading.value) {
        return (
          <div
            class={styles.content.loadingContainer}
          />
        )
      }

      if (listStore.list.isReady.value && listStore.pagination.state.total === 0) {
        return (
          <Empty
            class={styles.content.empty}
            description="没有文件"
          />
        )
      }

      return <></>
    }

    function List() {
      return (
        <>
          {
            (
              !listStore.list.error.value
              && listStore.list.state.value?.data
            ) && (
              <FileList
                class={styles.content.fileList}
                actionConfig={actionConfig.value}
                checkeds={listStore.itemChecked.checkedSet.value}
                listData={listStore.list.state.value?.data}
                viewType={viewType.value}
                onChecked={listStore.itemChecked.updateChecked}
                onCheckedClear={listStore.itemChecked.clearAllChecked}
                onDragMove={handleDragMove}
                onRadio={listStore.itemChecked.radioChecked}
              >
              </FileList>
            )
          }
        </>
      )
    }

    function FixedBottom() {
      if (listStore.list.isReady.value && listStore.pagination.state.pageCount > 1) {
        return (
          <Pagination
            key="pagination"
            class={styles.state.pagination}
            currentPage={listStore.pagination.state.page}
            currentPageSize={listStore.pagination.state.size}
            showSizeChanger={false}
            total={listStore.pagination.state.total}
            onCurrentPageChange={listStore.pagination.changePage}
            onPageSizeChange={listStore.pagination.changeSize}
          />
        )
      }
      return <></>
    }

    const route = useRoute()
    watch(() => route.query.keyword, (value) => {
      searchKeyword.value = value as string
    }, {
      immediate: true,
    })

    onBeforeMount(() => {
      listStore.refresh()
    })

    onBeforeMount(() => {
      if (route.query.offline_url) {
        actionHandlers.cloudDownload(route.query.offline_url as string)
      }
    })

    return () => (
      <div class={styles.container.root}>
        <Layout class={styles.container.layout}>
          {/* navbar */}
          <Navbar>
            {{
              default: () => (
                <DriveSearchBar
                  modelValue={searchKeyword.value}
                  onEnter={e => handleSearch(e)}
                />
              ),
              right: () => (
                <UserInfo />
              ),
            }}
          </Navbar>
          {/* sider */}
          <Sider>
            <SiderContent></SiderContent>
          </Sider>
          {/* main */}
          <Main class={styles.container.main}>
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
