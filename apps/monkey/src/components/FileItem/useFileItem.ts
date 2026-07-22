import type { Share } from '@115master/drive115'
import { useAsyncState } from '@vueuse/core'
import { computed, h, shallowRef } from 'vue'
import { router } from '@/app/router'
import { useDialog } from '@/components'
import { useDndSource, useDndTarget } from '@/components/Dnd'
import DragImage from '@/components/FileList/DragImage'
import { useFolderImagePreview } from '@/hooks/useFolderImagePreview'
import { useSmartVideoCover } from '@/hooks/useVideoCover'
import { actressFaceDB } from '@/utils/actressFaceDB'
import { getFilesItemId } from '@/utils/filesItem'
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
  pathSelect?: boolean
  selectMode?: boolean
  cid?: string
  order?: Share.Base.Sorter['o']
  asc?: Share.Base.Sorter['asc']
  onPreview?: (data: Share.Entity.FilesItem) => void
  /** 拖拽激活时惰性求值被拖项（自动勾选当前项后返回全集） */
  dragPayload?: () => Share.Entity.FilesItem[]
  onDragMove?: (cid: string, items: Share.Entity.FilesItem[]) => void
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

  /** 拖拽源（缩略图按住拖动）：触摸仅在多选态启用 */
  const source = useDndSource<Share.Entity.FilesItem[]>({
    payload: () => options.dragPayload?.() ?? [data],
    ghost: items => h(DragImage, { items }),
    offset: { x: 36, y: 36 },
    disabled: e => !!options.pathSelect || (e.pointerType === 'touch' && !options.selectMode),
  })

  /** 投放目标：仅文件夹，且被拖项不含自身 */
  const target = useDndTarget<Share.Entity.FilesItem[]>({
    id: getFilesItemId(data),
    el: () => itemRef.value,
    accept: items => isFolder.value && !items.some(item => getFilesItemId(item) === getFilesItemId(data)),
    onDrop: items => options.onDragMove?.(getFilesItemId(data), items),
  })

  return {
    itemRef,
    isDrogzone: target.hovering,
    isVideo,
    isFolder,
    link,
    hasActressCover,
    hasVideoCover,
    hasImagePreview,
    actressAsyncState,
    videoCoverResult,
    open,
    onPointerdown: source.onPointerdown,
    isIconUrl,
  }
}
