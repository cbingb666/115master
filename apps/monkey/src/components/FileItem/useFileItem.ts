import type { Share } from '@115master/drive115'
import { useAsyncState } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
import { router } from '@/app/router'
import { useDialog } from '@/components'
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
  const dialog = useDialog()
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

  const hasImagePreview = computed(() => !!data.u)

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
    hasImagePreview,
    actressAsyncState,
    videoCoverResult,
    open,
    isIconUrl,
  }
}
