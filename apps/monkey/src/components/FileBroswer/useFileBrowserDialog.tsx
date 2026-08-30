import type { Share } from '@115master/drive115'
import type { DialogSize } from '@115master/ui'
import { Pagination, Pill } from '@115master/ui'
import { ref, shallowRef } from 'vue'
import { useAppDialog } from '@/app/dialog'
import { router } from '@/app/router'
import { PAGINATION_LABELS } from '@/constants'
import { useQueryNav } from '@/hooks/useDriveNav'
import FileBroswer from './FileBroswer'

export interface FileBrowserDialogOptions {
  /** 对话框标题 */
  title: string
  /** 确认按钮文案 */
  confirmText?: string
  /** 默认目录 ID */
  defaultCid: string
  /** 尺寸档位，默认 'xl' */
  size?: DialogSize
  /** 是否需要返回路径 */
  returnPath?: boolean
}

export interface FileBrowserDialogResult {
  cid: string
  path: Share.Entity.PathItem[]
}

/** 文件浏览器对话框 */
export function useFileBrowserDialog() {
  const dialog = useAppDialog()

  function open(options: FileBrowserDialogOptions): Promise<FileBrowserDialogResult | false> {
    const cid = ref(options.defaultCid ?? '0')
    const keyword = ref('')
    const path = ref<Share.Entity.PathItem[] | null>(null)
    const page = shallowRef(1)
    const size = shallowRef(20)
    const total = shallowRef(0)

    return new Promise((resolve, reject) => {
      let result: FileBrowserDialogResult | false = false
      let instance: ReturnType<typeof dialog.create> | undefined
      const nav = useQueryNav(router, {
        defaultCid: options.defaultCid ?? '0',
        onExit: () => instance?.close(),
      })

      instance = dialog.create({
        label: options.title,
        confirmText: options.confirmText,
        closeOnBackdrop: true,
        size: options.size ?? 'xl',
        immersive: true,
        actions: () => total.value > size.value
          ? (
              <div
                class="flex w-full basis-full justify-center sm:absolute sm:left-1/2 sm:block sm:w-auto sm:basis-auto sm:-translate-x-1/2 max-sm:[&~.ui-button]:basis-0"
                data-file-browser-pagination
              >
                <Pill as="div" variant="glass-floating" size="sm" class="h-auto justify-center p-0 sm:p-1">
                  <Pagination
                    currentPage={page.value}
                    currentPageSize={size.value}
                    size="sm"
                    showSizeChanger={false}
                    total={total.value}
                    labels={PAGINATION_LABELS}
                    onCurrentPageChange={value => page.value = value}
                    onPageSizeChange={(value) => {
                      size.value = value
                      page.value = 1
                    }}
                  />
                </Pill>
              </div>
            )
          : undefined,
        content: () => (
          <div class="h-[min(50rem,calc(100dvh-11rem))]">
            <FileBroswer
              title={options.title}
              cid={cid}
              page={page}
              size={size}
              total={total}
              keyword={keyword}
              defaultCid={options.defaultCid ?? '0'}
              currentPathRef={options.returnPath ? path : undefined}
              nav={nav}
            />
          </div>
        ),
        onConfirm: () => {
          result = {
            cid: cid.value,
            path: (path.value ?? []) as Share.Entity.PathItem[],
          }
        },
      })

      void instance.closed.then((outcome) => {
        keyword.value = ''
        nav.dispose()
        if (outcome.reason === 'confirm')
          resolve(result)
        else
          resolve(false)
      }, (cause) => {
        keyword.value = ''
        nav.dispose()
        reject(cause)
      })
    })
  }

  return { open }
}
