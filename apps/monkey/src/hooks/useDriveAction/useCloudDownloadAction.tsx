import type { Share } from '@115master/drive115'
import { Core } from '@115master/drive115'
import { ref } from 'vue'
import { useAppDialog } from '@/app/dialog'
import {
  CloudDownload,
  useFileBrowserDialog,
  useToast,
} from '@/components'
import { useOfflineSpaceStore } from '@/store/offlineSpace'
import { useUserAqStore } from '@/store/userAq'
import { drive115 } from '@/utils/drive115Instance'
import { summarizeErrors } from './helpers'

type Path = InstanceType<typeof CloudDownload>['$props']['path']

/** 离线下载操作 */
export function useCloudDownloadAction() {
  const dialog = useAppDialog()
  const toast = useToast()
  const fileBrowser = useFileBrowserDialog()

  /** 目录选择对话框 */
  async function picker(
    pid: string,
    directory: ReturnType<typeof ref<{ cid: string, path: Path }>>,
  ) {
    const result = await fileBrowser.open({
      title: '保存到',
      confirmText: '保存到此目录',
      defaultCid: pid ?? '0',
      returnPath: true,
    })

    if (!result)
      return

    if (result.path.length === 0) {
      await dialog.alert({
        title: '提示',
        content: '请选择一个目录',
      })
      return
    }

    directory.value = {
      cid: result.cid,
      path: result.path as Path,
    }
  }

  /** 提交离线下载任务 */
  function submit(urls: string[], pid: string) {
    const user = useUserAqStore()
    const space = useOfflineSpaceStore()

    return drive115.offline.postOfflineAddUrls({
      ...Object.assign({}, ...urls.map((url, index) => ({ [`url[${index}]`]: url }))),
      wp_path_id: pid,
      uid: user.state?.data.uid,
      sign: space.state?.sign,
      time: Date.now(),
    })
  }

  /** 处理提交结果反馈 */
  async function feedback(res: Awaited<ReturnType<typeof submit>>): Promise<boolean> {
    if (!res.state || !res.result || res.result.length === 0) {
      await dialog.alert({
        title: '错误',
        content: res.message || '添加离线下载任务失败',
      })
      return false
    }

    const success = res.result.filter(r => r.state).length
    const total = res.result.length

    if (success === total) {
      toast.success(`成功添加 ${success} 个离线下载任务`)
      return true
    }

    if (success > 0) {
      toast.success(`成功添加 ${success}/${total} 个离线下载任务`)
      const failed = res.result.filter(r => !r.state)
      if (failed.length > 0) {
        await dialog.alert({
          title: '部分任务添加失败',
          // r.error_msg: res.result[] 中的项是原始后端数据，未经 normalizeResponse 处理
          content: summarizeErrors(failed.map(r => r.error_msg)),
        })
      }
      return true
    }

    await dialog.alert({
      title: '添加任务失败',
      // r.error_msg: res.result[] 中的项是原始后端数据，未经 normalizeResponse 处理
      content: summarizeErrors(res.result.map(r => r.error_msg)),
    })
    return false
  }

  /** 离线下载 */
  async function cloudDownload(pid: string = '', path: Share.Entity.PathItem[] = [], urls: string = ''): Promise<boolean> {
    const input = ref(urls)

    // 打开后如果是根目录则默认选择云下载目录，否则保持原目录
    pid = pid === '0' ? '' : pid
    const isEmpty = pid === ''
    const defaultPid = pid
    const defaultPath = isEmpty
      ? [
          {
            cid: '0',
            name: '根目录',
          },
          {
            cid: '',
            name: '云下载',
          },

        ]
      : path

    const directory = ref<{
      cid: string
      path: Partial<Share.Entity.PathItem>[]
    }>({
      cid: defaultPid,
      path: defaultPath,
    })

    return new Promise<boolean>((resolve) => {
      let resolved = false

      const instance = dialog.create({
        title: '离线下载',
        closeOnBackdrop: true,
        history: true,
        size: 'lg',
        content: () => (
          <CloudDownload
            path={directory.value.path}
            inputValue={input.value}
            onSelectDirectory={() => picker(directory.value.cid, directory)}
            onSelectPath={(fileId, fileName, path) => {
              directory.value = {
                cid: fileId,
                path: path && path.length > 0
                  ? path
                  : [{
                      cid: fileId,
                      name: fileName,
                    }],
              }
            }}
            onInput={value => input.value = value}
          />
        ),
        onConfirm: async () => {
          const parsed = input.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0)

          if (parsed.length === 0) {
            await dialog.alert({ title: '提示', content: '请输入下载链接' })
            return false
          }

          try {
            const ok = await feedback(await submit(parsed, directory.value.cid))
            if (!ok)
              return false
            if (resolved)
              return
            resolved = true
            resolve(true)
          }
          catch (error) {
            const result = Core.toResult(Core.toDrive115Error(error))
            await dialog.alert({
              title: '提示',
              content: `添加离线下载任务失败: ${result.message}`,
            })
            return false
          }
        },
      })

      void instance.closed.then(() => {
        if (resolved)
          return
        resolved = true
        resolve(false)
      }, () => {
        if (resolved)
          return
        resolved = true
        resolve(false)
      })
    })
  }

  return {
    cloudDownload,
  }
}
