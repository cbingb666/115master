import type { ImagePage, ImagePreviewItem, PageInfo } from './types'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { computed, shallowRef } from 'vue'

const DEFAULT_PAGE_SIZE = 1000

interface UseImagePreviewerOptions {
  pageSize?: number
}

export function useImagePreviewer(options: UseImagePreviewerOptions = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE

  const isOpen = shallowRef(false)
  const pages = shallowRef<ImagePage[]>([])
  const currentPageNum = shallowRef(1)
  const loading = shallowRef(false)

  const currentPage = computed(() =>
    pages.value.find(p => p.pageNum === currentPageNum.value),
  )

  const currentImages = computed(() =>
    currentPage.value?.items ?? [],
  )

  const pageInfo = computed<PageInfo>(() => ({
    current: currentPageNum.value,
    total: pages.value.length,
  }))

  const hasNextPage = computed(() =>
    currentPageNum.value < pages.value.length,
  )

  const hasPrevPage = computed(() =>
    currentPageNum.value > 1,
  )

  /** 构建 Fancybox 数据源 */
  function buildDataSource(images: ImagePreviewItem[]) {
    return images.map((item, index) => ({
      src: item.src,
      thumbSrc: item.thumbSrc,
      caption: item.caption,
      index,
    }))
  }

  /** 打开预览器 */
  function open(allImages: ImagePreviewItem[], startIndex: number) {
    if (allImages.length === 0)
      return

    /** 分页切片 */
    const newPages: ImagePage[] = []
    for (let i = 0; i < allImages.length; i += pageSize) {
      const pageNum = Math.floor(i / pageSize) + 1
      newPages.push({
        pageNum,
        items: allImages.slice(i, i + pageSize).map((item, idx) => ({
          ...item,
          globalIndex: i + idx,
        })),
        loaded: true,
      })
    }
    pages.value = newPages

    /** 确定起始页 */
    const startPageNum = Math.floor(startIndex / pageSize) + 1
    const pageStartIndex = startIndex % pageSize
    currentPageNum.value = startPageNum

    const initialImages = newPages[startPageNum - 1]?.items ?? []

    isOpen.value = true

    Fancybox.show(buildDataSource(initialImages), {
      startIndex: pageStartIndex,
      mainStyle: {
        '--fancybox-backdrop-bg': 'rgba(0, 0, 0, 1)',
      },
      Carousel: {
        transition: 'crossfade',
        Toolbar: {
          display: {
            left: ['counter'],
            right: ['thumbs', 'download', 'fullscreen', 'close'],
          },
        },
      },
      on: {
        close: () => {
          isOpen.value = false
        },
      },
    })
  }

  /** 关闭预览器 */
  function close() {
    Fancybox.close()
    isOpen.value = false
  }

  return {
    isOpen,
    loading,
    pageInfo,
    currentImages,
    hasNextPage,
    hasPrevPage,
    open,
    close,
  }
}

export type UseImagePreviewerReturn = ReturnType<typeof useImagePreviewer>
