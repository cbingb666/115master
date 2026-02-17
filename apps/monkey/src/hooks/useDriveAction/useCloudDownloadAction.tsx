import type { WebApi } from '@115master/drive115'
import { ref } from 'vue'
import {
  CloudDownload,
  FileBroswer,
  useDialog,
  useToast,
} from '@/components'
import { useOfflineSpaceStore } from '@/store/offlineSpace'
import { useUserAqStore } from '@/store/userAq'
import { drive115 } from '@/utils/drive115Instance'

type Path = InstanceType<typeof CloudDownload>['$props']['path']

/** 离线下载操作 */
export function useCloudDownloadAction() {
  const dialog = useDialog()
  const toast = useToast()

  /** 目录选择对话框 */
  function picker(
    pid: string,
    directory: ReturnType<typeof ref<{ cid: string, path: Path }>>,
  ) {
    const query = {
      keyword: ref(''),
      page: ref(1),
      size: ref(20),
      cid: ref(pid ?? '0'),
      area: ref(''),
      suffix: ref(''),
      type: ref(''),
      nf: ref('1'),
    }

    const path = ref<Path | null>(null)

    dialog.create({
      title: '选择保存目录',
      maskClosable: true,
      className: 'sm:w-11/12! sm:max-w-5xl! h-5/6!',
      content: () => <FileBroswer query={query} currentPathRef={path} />,
      confirmCallback: async () => {
        if (!path.value || !query.cid.value) {
          await dialog.alert({
            title: '提示',
            content: '请选择一个目录',
          })
          return
        }
        directory.value = {
          cid: query.cid.value,
          path: path.value,
        }
      },
    })
  }

  /** 提交离线下载任务 */
  function submit(urls: string[], pid: string) {
    const user = useUserAqStore()
    const space = useOfflineSpaceStore()

    return drive115.NormalApiPostOfflineAddUrls({
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
        content: res.error_msg || '添加离线下载任务失败',
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
          content: failed.map(r => r.error_msg || '未知错误').join('\n'),
        })
      }
      return true
    }

    await dialog.alert({
      title: '添加任务失败',
      content: res.result.map(r => r.error_msg || '未知错误').join('\n'),
    })
    return false
  }

  /** 离线下载 */
  async function cloudDownload(pid: string = '', path: WebApi.Entity.PathItem[] = [], urls: string = ''): Promise<boolean> {
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
      path: Partial<WebApi.Entity.PathItem>[]
    }>({
      cid: defaultPid,
      path: defaultPath,
    })

    return new Promise<boolean>((resolve) => {
      dialog.create({
        title: '离线下载',
        maskClosable: true,
        className: 'sm:w-11/12! sm:max-w-3xl!',
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
        confirmCallback: async () => {
          const parsed = input.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0)

          if (parsed.length === 0) {
            await dialog.alert({ title: '提示', content: '请输入下载链接' })
            return false
          }

          if (!directory.value.cid) {
            await dialog.alert({ title: '提示', content: '请选择保存目录' })
            return false
          }

          try {
            const ok = await feedback(await submit(parsed, directory.value.cid))
            if (!ok)
              return false
            resolve(true)
          }
          catch (error) {
            await dialog.alert({
              title: '提示',
              content: `添加离线下载任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
            })
            return false
          }
        },
        cancelCallback: () => resolve(false),
      })
    })
  }

  return {
    cloudDownload,
  }
}
