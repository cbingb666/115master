import type { Entity } from '@115master/drive115'
import { useAsyncState } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
import { router } from '@/app/router'
import { useDialog } from '@/components'
import { useFolderImagePreview } from '@/hooks/useFolderImagePreview'
import { useSmartVideoCover } from '@/hooks/useVideoCover'
import { actressFaceDB } from '@/utils/actressFaceDB'
import { getFilesItemId } from '@/utils/filesItem'
import { extractEmojis } from '@/utils/string'
import { Utils115 } from '@/utils/utils115'

interface LinkValue {
  to?: string
  href?: string
  target?: string
}

interface ActressFaceDBActress {
  url: string
  name: string
  folder: string
  filename: string
  timestamp: number
}

interface UseFileItemOptions {
  data: Entity.FilesItem
  pathSelect?: boolean
  cid?: string
  order?: Entity.Sorter['o']
  asc?: Entity.Sorter['asc']
  onPreview?: (data: Entity.FilesItem) => void
}

export function useFileItem(options: UseFileItemOptions) {
  const { data, onPreview } = options
  const dialog = useDialog()
  const itemRef = shallowRef<HTMLElement>()
  const isDrogzone = shallowRef(false)
  const isDragging = shallowRef(false)

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
  const emoji = computed(() => extractEmojis(data.n ?? '')[0])

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

  const link = computed<LinkValue | undefined>(() => {
    if (Utils115.isVideo(data.iv)) {
      return {
        to: `/video/${data.pc}`,
        target: '_self',
      }
    }

    if (Utils115.isSupportOpenDoc(data.ico)) {
      return {
        href: Utils115.GetOpenDocUrl({
          pickCode: data.pc,
          ico: data.ico,
          sha1: data.sha,
          shareId: '',
          from: '',
        }).href,
        target: '_blank',
      }
    }

    if (data.fc === 0) {
      return {
        to: `/drive/${data.cid}`,
        target: '_self',
      }
    }

    return undefined
  })

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

  async function open(): Promise<void> {
    if (link.value) {
      if ('to' in link.value) {
        router.push(link.value.to!)
        return
      }
      if ('href' in link.value) {
        window.open(link.value.href, link.value.target)
        return
      }
    }

    // 图片预览：优先使用 folder preview
    if (data.u) {
      if (folderPreview) {
        await folderPreview.open(data)
      }
      else {
        onPreview?.(data)
      }
      return
    }

    dialog.alert({
      title: '提示',
      content: '暂不支持打开该文件类型',
      confirmText: '知道了',
    })
  }

  function handleDragLeave(): void {
    isDrogzone.value = false
  }

  function handleDragOver(e: DragEvent): void {
    e.preventDefault()

    // 只有文件夹才允许作为拖拽目标
    if (!isFolder.value) {
      return
    }

    isDrogzone.value = true
  }

  function handleDrop(e: DragEvent, onDrop?: (e: DragEvent) => void): void {
    if (!isDrogzone.value) {
      return
    }

    isDrogzone.value = false

    const dropData = e.dataTransfer?.getData('application/json')
    if (!dropData) {
      return
    }

    /** 如果拖拽的文件中包含当前文件，则不进行拖拽 */
    const items = JSON.parse(dropData) as Entity.FilesItem[]
    if (items.some(item => getFilesItemId(item) === getFilesItemId(data))) {
      return
    }

    onDrop?.(e)
  }

  return {
    itemRef,
    isDrogzone,
    isDragging,
    isVideo,
    isFolder,
    emoji,
    link,
    hasActressCover,
    hasVideoCover,
    hasImagePreview,
    actressAsyncState,
    videoCoverResult,
    open,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    isIconUrl,
  }
}
