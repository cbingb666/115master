import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import { MarkStatus } from '@115master/drive115'
import { defineComponent, ref, useTemplateRef, watch } from 'vue'
import { useDialog, useToast } from '@/components'
import { DriveFileBrowserContent } from '@/hooks/useDriveFileBroswerDialog'
import { useOfflineQuotaPackageInfoStore } from '@/store/offlineQuotaPackageInfo'
import { useOfflineSpaceStore } from '@/store/offlineSpace'
import { useUserAqStore } from '@/store/userAq'
import { drive115 } from '@/utils/drive115Instance'
import { promiseDelay } from '@/utils/promise'

/** 云下载输入组件（链接输入 + 目录显示） */
const CloudDownloadInput = defineComponent({
  props: {
    urlsValue: {
      type: String,
      required: true,
    },
    currentDirectory: {
      type: Object as PropType<{ name: string, path: string }>,
      required: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    onUrlsChange: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    onDirectorySelect: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const quotaStore = useOfflineQuotaPackageInfoStore()

    const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')

    watch(textareaRef, () => {
      if (textareaRef.value) {
        setTimeout(() => {
          textareaRef.value?.focus()
        }, 100)
      }
    })

    return () => (
      <div class="flex flex-col gap-4">
        {/* 链接输入区域 */}
        <div>
          <textarea
            ref="textareaRef"
            class="resize-vertical font-inherit focus:border-primary w-full rounded-md border border-gray-200 p-3 text-sm leading-5 outline-none"
            autofocus
            placeholder={props.placeholder}
            rows={4}
            value={props.urlsValue}
            onInput={e => props.onUrlsChange((e.target as HTMLTextAreaElement).value)}
          />
        </div>

        <div class="flex items-center gap-2 text-sm text-gray-500">
          本月配额：剩
          {quotaStore.state?.surplus}
          /总
          {quotaStore.state?.count}
          个
          <a
            class="link link-primary"
            href="https://vip.115.com/?c=601"
            target="_blank"
          >
            购买配额
          </a>
        </div>

        {/* 保存目录显示和选择 */}
        <div>
          <label class="mb-2 block text-sm font-medium">
            保存到
          </label>
          <div class="flex items-center ">
            <div class="flex min-w-0 flex-1">
              <span class="mb-1 text-sm font-medium">
                {props.currentDirectory.name}
              </span>
              <span class="text-xs break-all text-gray-500">
                {props.currentDirectory.path}
              </span>
            </div>
            <button
              class="btn"
              type="button"
              onClick={props.onDirectorySelect}
            >
              选择目录
            </button>
          </div>
        </div>
      </div>
    )
  },
})

/** 操作 */
export function useDriveAction() {
  const dialog = useDialog()
  const toast = useToast()

  /** 获取文件ID */
  function getFileIds(items: WebApi.Entity.FilesItem[]): string[] {
    return items.map(item => item.fid ?? item.cid)
  }

  /** 置顶批量 */
  async function topBatch(items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const hasTop = items.some(item => item.is_top === 1)
    const top = hasTop ? 0 : 1
    const fileIds = getFileIds(items)
    const res = await drive115.webApiPostFilesTop({
      file_id: fileIds.join(','),
      top,
    })
    if (res.state) {
      toast.success(hasTop ? '取消置顶成功' : '置顶成功')
      return Promise.resolve(true)
    }
    else {
      await dialog.alert({
        title: '提示',
        content: res.error,
      })
    }

    return Promise.resolve(false)
  }

  /** 星标批量 */
  async function starBatch(items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const hasStar = items.some(item => item.m === 1 || item.m === '1')
    const star = hasStar ? MarkStatus.Unmark : MarkStatus.Mark
    const fileIds = getFileIds(items)
    const res = await drive115.webApiPostFilesStar({
      file_id: fileIds,
      star,
    })
    if (res.state) {
      toast.success(hasStar ? '取消星标成功' : '星标成功')
      return Promise.resolve(true)
    }
    else {
      await dialog.alert({
        title: '提示',
        content: res.error,
      })
    }

    return Promise.resolve(false)
  }

  /** 移动对话框 */
  async function moveDialog(defaultpid: string): Promise<string | false> {
    /** 将 query 状态提升到这里 */
    const query = {
      keyword: ref(''),
      page: ref(1),
      size: ref(20),
      cid: ref(defaultpid ?? '0'),
      area: ref(''),
      suffix: ref(''),
      type: ref(''),
      nf: ref('1'),
    }

    return new Promise((resolve) => {
      dialog.create({
        title: '移动到',
        maskClosable: true,
        className: 'sm:w-11/12! sm:max-w-5xl! h-5/6!',
        content: () => <DriveFileBrowserContent query={query} />,
        confirmCallback: () => {
        // 直接访问上层的 query.cid.value
          resolve(query.cid.value)
        },
        cancelCallback: () => {
          resolve(false)
        },
      })
    })
  }

  /** 保存目录选择对话框 */
  async function saveDirectoryDialog(defaultpid: string): Promise<{ cid: string, name: string, path: string } | null> {
    const query = {
      keyword: ref(''),
      page: ref(1),
      size: ref(20),
      cid: ref(defaultpid ?? '0'),
      area: ref(''),
      suffix: ref(''),
      type: ref(''),
      nf: ref('1'),
    }

    return new Promise((resolve) => {
      dialog.create({
        title: '选择保存目录',
        maskClosable: true,
        className: 'sm:w-11/12! sm:max-w-5xl! h-5/6!',
        content: () => <DriveFileBrowserContent query={query} />,
        confirmCallback: async () => {
          // 这里需要获取目录信息，暂时先返回基本信息
          // 后续可以通过 API 获取完整的路径信息
          resolve({
            cid: query.cid.value,
            name: query.cid.value === '0' ? '根目录' : `目录 ${query.cid.value}`,
            path: query.cid.value === '0' ? '/' : `/目录${query.cid.value}`,
          })
        },
        cancelCallback: () => {
          resolve(null)
        },
      })
    })
  }

  /** 获取移动进度 */
  async function moveGetProgress(move_proid: string) {
    const res = await drive115.webApiGetFilesMoveProgress({
      move_proid,
    })
    if (res.progress === 100) {
      return Promise.resolve(res.progress)
    }
    else {
      await promiseDelay(3000)
      return moveGetProgress(move_proid)
    }
  }

  /** 移动核心 */
  async function moveCore(pid: string, items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const fileIds = getFileIds(items)
    const fids = Object.fromEntries(
      fileIds.map((val, index) => [`fid[${index}]`, val]),
    )
    const move_proid = Date.now().toString()
    const res = await drive115.webApiPostFilesMove({
      pid,
      ...fids,
      move_proid,
    })
    if (res.state) {
      const progress = await moveGetProgress(move_proid)
      if (progress === 100) {
        toast.success('移动成功')
        return Promise.resolve(true)
      }
    }
    else {
      await dialog.alert({
        title: '提示',
        content: res.error,
      })
    }

    return Promise.resolve(false)
  }

  /** 移动批量 */
  async function moveBatch(defaultPid: string, items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const pid = await moveDialog(defaultPid)
    if (!pid) {
      return Promise.resolve(false)
    }
    return await moveCore(pid, items)
  }

  /** 拖拽移动 */
  async function dragMove(cid: string, originItems: WebApi.Entity.FilesItem[]) {
    return await moveCore(cid, originItems)
  }

  /** 提到上级 */
  async function improve(items: WebApi.Entity.FilesItem [], prevLevelId: string): Promise<boolean> {
    const dialogRes = await dialog.confirm({
      title: '提到上级',
      content: '将文件提升到上级目录，确定提升吗？',
    })
    if (!dialogRes) {
      return Promise.resolve(false)
    }

    const moveRes = await moveCore(prevLevelId, items)
    if (moveRes) {
      toast.success('提到上级成功')
    }

    return Promise.resolve(false)
  }

  /** 重命名 */
  async function renameItem(item: WebApi.Entity.FilesItem): Promise<boolean> {
    const dialogRes = await dialog.prompt({
      title: '重命名',
      placeholder: '请输入文件名',
      defaultValue: item.n,
    })

    if (dialogRes) {
      const fid = item.fid ?? item.cid
      const res = await drive115.webApiPostFilesBatchRename({
        fid,
        file_name: dialogRes,
        [`files_new_name[${fid}]`]: dialogRes,
      })
      if (res.state) {
        toast.success('重命名成功')
        return Promise.resolve(true)
      }
      else {
        await dialog.alert({
          title: '提示',
          content: res.error,
        })
      }
    }

    return Promise.resolve(false)
  }

  /** 删除确认 */
  async function deleteConfirm() {
    return dialog.confirm({
      title: '提示',
      content: '确定删除吗？',
    })
  }

  /** 删除核心 */
  async function deleteCore(pid: string, items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const confirm = await deleteConfirm()
    if (confirm) {
      const fileIds = getFileIds(items)
      const fids = Object.fromEntries(
        fileIds.map((val, index) => [`fid[${index}]`, val]),
      )
      const res = await drive115.webApiPostRbDelete({
        pid,
        ...fids,
      })
      if (res.state) {
        toast.success('删除成功')
        return Promise.resolve(true)
      }
      else {
        await dialog.alert({
          title: '提示',
          content: res.error,
        })
      }
    }

    return Promise.resolve(false)
  }

  /** 删除批量 */
  async function deleteBatch(pid: string, items: WebApi.Entity.FilesItem[]) {
    return await deleteCore(pid, items)
  }

  /** 新建文件夹 */
  async function newFolder(pid: string = '0', defaultValue: string = ''): Promise<boolean> {
    const dialogRes = await dialog.prompt({
      title: '新建文件夹',
      defaultValue,
      placeholder: '请输入文件夹名称',
      inputType: 'text',
      required: true,
      maxLength: 256,
    })

    if (dialogRes) {
      const res = await drive115.webApiPostFilesAdd({
        pid,
        cname: dialogRes,
      })
      if (res.state) {
        toast.success('新建文件夹成功')
        return Promise.resolve(true)
      }
      else {
        await dialog.alert({
          title: '提示',
          content: res.error,
        })

        await newFolder(pid, dialogRes)
      }
    }

    return Promise.resolve(false)
  }

  /** 离线下载 */
  async function cloudDownload(defaultpid: string = '0', defaultUrls: string = ''): Promise<boolean> {
    /** 状态管理 */
    const urlsValue = ref(defaultUrls)
    const selectedDirectory = ref({
      cid: defaultpid,
      name: defaultpid === '0' ? '根目录' : `目录 ${defaultpid}`,
      path: defaultpid === '0' ? '/' : `/目录${defaultpid}`,
    })
    const userStore = useUserAqStore()
    const spaceStore = useOfflineSpaceStore()

    /** 目录选择处理函数 */
    const handleDirectorySelect = async () => {
      const result = await saveDirectoryDialog(selectedDirectory.value.cid)
      if (result) {
        selectedDirectory.value = result
      }
    }

    const cloudDownloadDialog = new Promise<{ urls: string[], pid: string }>((resolve) => {
      dialog.create({
        title: '离线下载',
        maskClosable: true,
        className: 'sm:w-11/12! sm:max-w-3xl!',
        content: () => (
          <CloudDownloadInput
            currentDirectory={{
              name: selectedDirectory.value.name,
              path: selectedDirectory.value.path,
            }}
            placeholder="支持HTTP、HTTPS、FTP、磁力链和电驴链接，换行可添加多个"
            urlsValue={urlsValue.value}
            onDirectorySelect={handleDirectorySelect}
            onUrlsChange={(value: string) => urlsValue.value = value}
          />
        ),
        confirmCallback: () => {
          const urls = urlsValue.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0)
          resolve({ urls, pid: selectedDirectory.value.cid })
        },
        cancelCallback: () => {
          resolve({ urls: [], pid: '' })
        },
      })
    })

    const { urls, pid } = await cloudDownloadDialog

    if (!urls || urls.length === 0) {
      return Promise.resolve(false)
    }

    if (!pid) {
      await dialog.alert({
        title: '提示',
        content: '请选择保存目录',
      })
      return Promise.resolve(false)
    }

    try {
      /** 批量添加下载任务 */
      const tasks = urls.map((url, index) => ({
        [`url[${index}]`]: url,
      }))

      /** 合并所有 URL 参数 */
      const urlParams = Object.assign({}, ...tasks)

      const data = {
        ...urlParams,
        wp_path_id: pid,
        uid: userStore.state?.data.uid,
        sign: spaceStore.state?.sign,
        time: Date.now(),
      }

      const res = await drive115.NormalApiPostOfflineAddUrls(data)

      if (res.state && res.result && res.result.length > 0) {
        const successCount = res.result.filter(r => r.state).length
        const totalCount = res.result.length

        if (successCount === totalCount) {
          toast.success(`成功添加 ${successCount} 个离线下载任务`)
          return Promise.resolve(true)
        }
        else if (successCount > 0) {
          toast.success(`成功添加 ${successCount}/${totalCount} 个离线下载任务`)

          /** 显示失败的详情 */
          const failedResults = res.result.filter(r => !r.state)
          if (failedResults.length > 0) {
            const errorMessage = failedResults
              .map(r => r.error_msg || '未知错误')
              .join('\n')

            await dialog.alert({
              title: '部分任务添加失败',
              content: errorMessage,
            })
          }
          return Promise.resolve(true)
        }
        else {
          const errorMessage = res.result
            .map(r => r.error_msg || '未知错误')
            .join('\n')

          await dialog.alert({
            title: '添加任务失败',
            content: errorMessage,
          })
        }
      }
      else {
        await dialog.alert({
          title: '错误',
          content: res.error_msg || '添加离线下载任务失败',
        })
      }
    }
    catch (error) {
      await dialog.alert({
        title: '提示',
        content: `添加离线下载任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
      })
    }

    return Promise.resolve(false)
  }

  return {
    topBatch,
    starBatch,
    moveBatch,
    dragMove,
    improve,
    deleteBatch,
    renameItem,
    newFolder,
    cloudDownload,
  }
}
