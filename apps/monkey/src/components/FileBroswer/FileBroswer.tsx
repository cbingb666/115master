import type { WebApi } from '@115master/drive115'
import type { Ref } from 'vue'
import type { NavSource } from '@/hooks/useDriveNav/types'
import { defineComponent, ref, watch } from 'vue'
import {
  FileItem,
  FileList,
  FileMenu,
  FilePageSizeSelector,
  FilePath,
  FileSortSelector,
  LoadingError,
  Pagination,
} from '@/components'
import { useDriveExplorer } from '@/hooks/useDriveExplorer'
import { useStackNav } from '@/hooks/useDriveNav'

/** 文件浏览器内容组件 */
const FileBroswer = defineComponent({
  name: 'DriveFileBrowserContent',
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

    const explorer = useDriveExplorer({
      nav,
      page: ref(1),
      size: ref(20),
      nf: ref('1'),
      scroll: hasExternalNav,
      getScroll: () => scrollRef.value?.scrollTop ?? 0,
      setScroll: (top: number) => scrollRef.value?.scrollTo({ top, behavior: 'instant' }),
    })

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

    function handleSort(
      order: WebApi.Entity.Sorter['o'],
      asc: WebApi.Entity.Sorter['asc'],
      fc_mix: WebApi.Entity.Sorter['fc_mix'],
    ) {
      explorer.page.changeSort(order, asc, fc_mix)
      explorer.page.changePage(1)
      explorer.refresh()
    }

    return () => (
      <div class="flex h-full flex-col [--drive-header-height:calc(var(--spacing)*10)]">
        <div class="sticky top-0 flex items-baseline-last justify-between gap-2">
          <FilePath
            path={explorer.path.value ?? []}
            onPathClick={handleClickPath}
          />
          <FileMenu>
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
              <FileList>
                {(explorer.list.data.value.data ?? []).map(item => (
                  <FileItem
                    key={item.pc}
                    data={item}
                    pathSelect={true}
                    onClick={() => handleClickItem(item)}
                  />
                ))}
              </FileList>

              {explorer.page.pageCount.value > 1 && (
                <div class="mt-4 flex justify-center">
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
