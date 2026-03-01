import type { WebApi } from '@115master/drive115'
import type { QueryNavReturn } from '@/hooks/useDriveNav/useQueryNav'
import { ref } from 'vue'
import { router } from '@/app/router'
import { useDialog } from '@/components'
import { useQueryNav } from '@/hooks/useDriveNav'
import FileBroswer from './FileBroswer'

export interface FileBrowserDialogOptions {
  /** 对话框标题 */
  title: string
  /** 默认目录 ID */
  defaultCid: string
  /** 对话框样式类名 */
  className?: string
  /** 是否需要返回路径 */
  returnPath?: boolean
}

export interface FileBrowserDialogResult {
  cid: string
  path: WebApi.Entity.PathItem[]
}

/** 文件浏览器对话框 */
export function useFileBrowserDialog() {
  const dialog = useDialog()

  function open(options: FileBrowserDialogOptions): Promise<FileBrowserDialogResult | false> {
    const cid = ref(options.defaultCid ?? '0')
    const path = ref<WebApi.Entity.PathItem[] | null>(null)

    return new Promise((resolve) => {
      let resolved = false
      let instance: ReturnType<typeof dialog.create>
      let nav: QueryNavReturn

      const handleExit = () => {
        if (resolved)
          return
        resolved = true
        nav.dispose()
        instance.hide()
        resolve(false)
      }

      nav = useQueryNav(router, {
        defaultCid: options.defaultCid ?? '0',
        onExit: handleExit,
      })

      instance = dialog.create({
        maskClosable: true,
        className: options.className ?? 'sm:w-11/12! h-7/8! overflow-hidden',
        classNameContent: 'min-h-0 overflow-hidden p-0!',
        content: () => (
          <FileBroswer
            title={options.title}
            cid={cid}
            defaultCid={options.defaultCid ?? '0'}
            currentPathRef={options.returnPath ? path : undefined}
            nav={nav}
          />
        ),
        confirmCallback: () => {
          if (resolved)
            return
          resolved = true
          nav.dispose()
          instance.hide()
          resolve({
            cid: cid.value,
            path: (path.value ?? []) as WebApi.Entity.PathItem[],
          })
        },
        cancelCallback: () => {
          if (resolved)
            return
          resolved = true
          nav.dispose()
          resolve(false)
        },
      })
    })
  }

  return { open }
}
