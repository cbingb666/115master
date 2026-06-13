import type { Entity, Sorter } from '@115master/drive115'
import type { ImagePreviewItem } from '@/components/ImagePreviewer/types'
import { useAsyncState } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useImagePreviewer } from '@/components/ImagePreviewer'
import { drive115 } from '@/utils/drive115Instance'
import { Utils115 } from '@/utils/utils115'

const BATCH_SIZE = 50
const DEFAULT_PAGE_SIZE = 1000

interface UseFolderImagePreviewOptions {
  cid: string
  order: Sorter['o']
  asc: Sorter['asc']
  fcMix?: Sorter['fc_mix']
  pageSize?: number
}

export function useFolderImagePreview(options: UseFolderImagePreviewOptions) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE

  const images = ref<ImagePreviewItem[]>([])
  const { isReady, execute, isLoading } = useAsyncState(
    async () => {
      const allImages = await fetchAllImages()
      images.value = allImages
      return allImages
    },
    [],
    { immediate: false },
  )

  const previewer = useImagePreviewer({ pageSize })

  const total = computed(() => images.value.length)

  const totalPages = computed(() =>
    Math.ceil(total.value / pageSize),
  )

  /** 获取文件夹所有图片 */
  async function fetchAllImages(): Promise<ImagePreviewItem[]> {
    const allItems: Entity.FilesItem[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const offset = (page - 1) * BATCH_SIZE
      const res = await drive115.file.getFiles({
        aid: 1,
        cid: options.cid || '0',
        show_dir: 1,
        offset,
        limit: BATCH_SIZE,
        format: 'json',
        natsort: 1,
        o: options.order,
        asc: options.asc,
        fc_mix: options.fcMix,
      })

      const items = res.data || []
      allItems.push(...items)

      hasMore = items.length === BATCH_SIZE
      page++

      // 安全限制：最多获取 10000 张图片
      if (allItems.length >= 10000) {
        break
      }
    }

    // 过滤出图片（有 u 字段的）
    return allItems
      .filter(item => Boolean(item.u))
      .map((item, index) => ({
        src: Utils115.getScaleThumbnail(item.u, 0),
        thumbSrc: item.u,
        caption: item.n,
        fileData: item,
        globalIndex: index,
      }))
  }

  /** 打开预览器 */
  async function open(startItem: Entity.FilesItem) {
    // 如果数据未加载，先加载
    if (!isReady.value) {
      await execute()
    }

    if (images.value.length === 0) {
      return
    }

    const startIndex = images.value.findIndex(
      img => img.fileData.pc === startItem.pc,
    )

    if (startIndex === -1) {
      // 起始图片不在列表中，从第一张开始
      previewer.open(images.value, 0)
      return
    }

    previewer.open(images.value, startIndex)
  }

  /** 关闭预览器 */
  function close() {
    previewer.close()
  }

  /** 刷新数据 */
  async function refresh() {
    await execute()
  }

  return {
    open,
    close,
    refresh,
    loading: isLoading,
    total,
    totalPages,
    currentPage: computed(() => previewer.pageInfo.value.current),
    isOpen: computed(() => previewer.isOpen),
  }
}

export type UseFolderImagePreviewReturn = ReturnType<typeof useFolderImagePreview>
