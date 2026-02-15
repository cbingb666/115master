import type { WebApi } from '@115master/drive115'

import type { Ref } from 'vue'
import { defineComponent, onBeforeMount, watch } from 'vue'
import { FileList, FileListItem, FileMenu, FileNewFolderButton, FilePageSizeSelector, FilePaths, FileSortSelector, LoadingError, Pagination } from '@/components'
import { useDriveFile } from '@/hooks/useDriveFile'

/** 文件浏览器内容组件 */
export const DriveFileBrowserContent = defineComponent({
  name: 'DriveFileBrowserContent',
  props: {
    query: {
      type: Object as () => {
        keyword: Ref<string>
        page: Ref<number>
        size: Ref<number>
        cid: Ref<string>
        area: Ref<string>
        suffix: Ref<string>
        type: Ref<string>
        nf: Ref<string>
      },
      required: true,
    },
  },
  setup(props) {
    /** 在组件内部提供状态 */
    const listStore = useDriveFile(props.query)

    /** 点击路径 */
    const handleClickPath = (data: WebApi.Entity.PathItem) => {
      props.query.cid.value = data.cid
    }

    /** 点击文件 */
    const handleClickItem = (data: WebApi.Entity.FilesItem) => {
      props.query.cid.value = data.cid
    }

    onBeforeMount(() => {
      console.log('onBeforeMount')
      listStore.refresh()
    })

    watch(() => props.query, () => {
      listStore.refresh()
    }, {
      deep: true,
    })

    const actionHandlers = {
      newFolder: () => {
        console.log('newFolder')
      },
    }

    return () => (
      <div class="flex h-full flex-col [--drive-header-height:calc(var(--spacing)*10)]">
        <div class="sticky top-0 flex items-baseline-last justify-between gap-2">
          {/* 头部路径和菜单 */}
          <FilePaths
            paths={listStore.path.value ?? []}
            onPathClick={handleClickPath}
          />
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
              onSort={listStore.sorter.change}
            />
          </FileMenu>
        </div>

        {/* 主内容区域 */}
        <div class="relative flex min-h-0 flex-1 flex-col p-4">
          {/* 错误状态 */}
          {listStore.list.error.value && (
            <LoadingError
              class="absolute inset-0 m-auto"
              message={listStore.list.error.value}
              size="mini"
            />
          )}

          {/* 加载状态 */}
          {listStore.list.isLoading.value && (
            <div class="loading loading-spinner loading-xl absolute inset-0 m-auto" />
          )}

          {/* 文件列表 */}
          {listStore.list.isReady.value && (
            <>
              <FileList
                actionConfig={[]}
                listData={listStore.list.state.value?.data ?? []}
              >
                {(listStore.list.state.value?.data ?? []).map(item => (
                  <FileListItem
                    key={item.pc}
                    data={item}
                    pathSelect={false}
                    onClick={handleClickItem}
                  />
                ))}
              </FileList>

              {/* 分页器 */}
              {listStore.pagination.state.pageCount > 1 && (
                <div class="mt-4 flex justify-center">
                  <Pagination
                    currentPage={listStore.pagination.state.page}
                    currentPageSize={listStore.pagination.state.size}
                    showSizeChanger={false}
                    total={listStore.pagination.state.total}
                    onCurrentPageChange={listStore.pagination.changePage}
                    onPageSizeChange={listStore.pagination.changeSize}
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
