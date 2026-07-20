import type { Share } from '@115master/drive115'
import type { DialogSize } from '@/components/Dialog'
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
  /** 尺寸档位，默认 'full'；className 可覆盖 */
  size?: DialogSize
  /** 对话框样式类名 */
  className?: string
  /** 是否需要返回路径 */
  returnPath?: boolean
}

export interface FileBrowserDialogResult {
  cid: string
  path: Share.Entity.PathItem[]
}

/** 文件浏览器对话框 */
export function useFileBrowserDialog() {
  const dialog = useDialog()

  function open(options: FileBrowserDialogOptions): Promise<FileBrowserDialogResult | false> {
    const cid = ref(options.defaultCid ?? '0')
    const keyword = ref('')
    const path = ref<Share.Entity.PathItem[] | null>(null)

    return new Promise((resolve) => {
      let resolved = false
      let instance: ReturnType<typeof dialog.create>
      let nav: QueryNavReturn

      const handleExit = () => {
        if (resolved)
          return
        resolved = true
        keyword.value = ''
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
        size: options.size ?? 'full',
        className: options.className,
        classNameContent: 'min-h-0 overflow-hidden p-0!',
        content: () => (
          <FileBroswer
            title={options.title}
            cid={cid}
            keyword={keyword}
            defaultCid={options.defaultCid ?? '0'}
            currentPathRef={options.returnPath ? path : undefined}
            nav={nav}
          />
        ),
        confirmCallback: () => {
          if (resolved)
            return
          resolved = true
          keyword.value = ''
          nav.dispose()
          instance.hide()
          resolve({
            cid: cid.value,
            path: (path.value ?? []) as Share.Entity.PathItem[],
          })
        },
        cancelCallback: () => {
          if (resolved)
            return
          resolved = true
          keyword.value = ''
          nav.dispose()
          resolve(false)
        },
      })
    })
  }

  return { open }
}
