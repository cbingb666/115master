import type { Share } from '@115master/drive115'
import { useAsyncState } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
import { useAppDialog } from '@/app/dialog'
import { router } from '@/app/router'
import { useFolderImagePreview } from '@/hooks/useFolderImagePreview'
import { useSmartVideoCover } from '@/hooks/useVideoCover'
import { actressFaceDB } from '@/utils/actressFaceDB'
import { openFilesItem, resolveFileLink } from '@/utils/openFilesItem'

interface ActressFaceDBActress {
  url: string
  name: string
  folder: string
  filename: string
  timestamp: number
}

interface UseFileItemOptions {
  data: Share.Entity.FilesItem
  cid?: string
  order?: Share.Base.Sorter['o']
  asc?: Share.Base.Sorter['asc']
  onPreview?: (data: Share.Entity.FilesItem) => void
}

export function useFileItem(options: UseFileItemOptions) {
  const { data, onPreview } = options
  const dialog = useAppDialog()
  const itemRef = shallowRef<HTMLElement>()

  /** 添加 folder image preview 支持 */
  const folderPreview = options.cid
    ? useFolderImagePreview({
        cid: options.cid,
        order: options.order ?? 'user_ptime',
        asc: options.asc ?? 0,
      })
    : null

  const isVideo = computed(() => data.iv === 1)
  const isFolder = computed(() => data.fc === 0)

  const actressAsyncState = useAsyncState(async () => {
    if (!isFolder.value) {
      return null
    }
    await actressFaceDB.init()
    const actress = await actressFaceDB.findActress(data.n.trim())
    return actress as ActressFaceDBActress | null
  }, null, {
    immediate: true,
  })

  const coverOptions = computed(() => ({
    pickCode: data.pc,
    sha1: data.sha,
    coverNum: 1,
    duration: data.play_long,
  }))

  const videoCoverResult = isVideo.value
    ? useSmartVideoCover(coverOptions, { elementRef: itemRef })
    : null

  const link = computed(() => resolveFileLink(data))

  const hasActressCover = computed(() =>
    actressAsyncState.isReady.value && !!actressAsyncState.state.value,
  )

  const hasVideoCover = computed<boolean>(() =>
    isVideo.value
    && !!videoCoverResult?.videoCover.isReady
    && videoCoverResult.videoCover.state.length > 0,
  )

  const isVideoCoverLoading = computed(() =>
    isVideo.value
    && !!videoCoverResult
    && !videoCoverResult.videoCover.isReady
    && !videoCoverResult.videoCover.error,
  )

  const hasImagePreview = computed(() => !!data.u)

  function showVideoCoverError(
    error: Error | string,
    retry: () => void | Promise<void>,
  ) {
    const content = typeof error === 'string'
      ? error
      : () => (
          <div class="space-y-3">
            <p class="text-base-content/80 m-0 leading-6">
              {error.message || error.name}
            </p>
            {error.stack && (
              <details class="text-sm">
                <summary class="text-base-content/60 cursor-pointer font-medium select-none">
                  技术详情
                </summary>
                <pre class="bg-base-200 text-base-content mt-3 max-h-64 overflow-auto rounded-lg p-3 text-xs break-all whitespace-pre-wrap select-text">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )

    return dialog.confirm({
      title: '视频封面加载失败',
      content,
      confirmText: '重试加载',
      cancelText: '关闭',
      confirmOnEnter: false,
      onConfirm: retry,
    })
  }

  function isIconUrl(icon: string): boolean {
    return icon.startsWith('https://')
  }

  function open(): Promise<void> {
    return openFilesItem(data, {
      router,
      alert: opts => dialog.alert(opts),
      folderPreview,
      onPreview,
    })
  }

  return {
    itemRef,
    isVideo,
    isFolder,
    link,
    hasActressCover,
    hasVideoCover,
    isVideoCoverLoading,
    hasImagePreview,
    actressAsyncState,
    videoCoverResult,
    showVideoCoverError,
    open,
    isIconUrl,
  }
}
