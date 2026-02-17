import { ref } from 'vue'
import { useDialog, useToast } from '@/components'
import { useOfflineSpaceStore } from '@/store/offlineSpace'
import { useUserAqStore } from '@/store/userAq'
import { drive115 } from '@/utils/drive115Instance'
import { CloudDownloadInput } from './CloudDownloadInput'
import { useMoveAction } from './useMoveAction'

/** 离线下载操作 */
export function useCloudDownloadAction() {
  const dialog = useDialog()
  const toast = useToast()
  const { saveDirectoryDialog } = useMoveAction()

  /** 离线下载 */
  async function cloudDownload(defaultpid: string = '0', defaultUrls: string = ''): Promise<boolean> {
    const urlsValue = ref(defaultUrls)
    const selectedDirectory = ref({
      cid: defaultpid,
      name: defaultpid === '0' ? '根目录' : `目录 ${defaultpid}`,
      path: defaultpid === '0' ? '/' : `/目录${defaultpid}`,
    })
    const userStore = useUserAqStore()
    const spaceStore = useOfflineSpaceStore()

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
      const tasks = urls.map((url, index) => ({
        [`url[${index}]`]: url,
      }))

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
    cloudDownload,
  }
}
