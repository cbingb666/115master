import type { Share } from '@115master/drive115'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { computed, ref, shallowRef, watch } from 'vue'
import { useListSelection } from '@/hooks/useListSelection'
import { getFilesItemId } from '@/utils/filesItem'
import { Utils115 } from '@/utils/utils115'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

export interface FileListInteractionProps {
  pathSelect: boolean
  listData: Share.Entity.FilesItem[]
  checkeds: Set<Share.Entity.FilesItem>
  onChecked: (item: Share.Entity.FilesItem, checked: boolean) => void
  onCheckedClear: () => void
  /** 默认态（非选择模式）plain click 打开该项 */
  onOpen?: (item: Share.Entity.FilesItem) => void
  onDragMove?: (cid: string, items: Share.Entity.FilesItem[]) => void
  /** 框选容器，缺省取列表网格容器 */
  marqueeContainer?: () => HTMLElement | undefined
  /** 框选边缘自动滚动使用的真实滚动容器 */
  marqueeScrollContainer?: () => HTMLElement | undefined
}

export function useFileList(props: FileListInteractionProps) {
  const containerRef = ref<HTMLElement>()
  const selectMode = shallowRef(false)
  const contextmenuShow = shallowRef(false)
  const contextmenuPosition = shallowRef({ x: 0, y: 0 })

  /** 通用多选交互（框选 + 点击 + Shift/Meta·Ctrl + ESC/Cmd·Ctrl+A） */
  const selection = useListSelection<Share.Entity.FilesItem>({
    container: () => props.marqueeContainer?.() ?? containerRef.value,
    scrollContainer: props.marqueeScrollContainer,
    list: () => props.listData,
    key: getFilesItemId,
    selection: {
      has: item => props.checkeds.has(item),
      toggle: props.onChecked,
      clear: () => props.onCheckedClear(),
    },
    disabled: props.pathSelect,
    onOpen: props.onOpen,
    selectMode: () => selectMode.value,
    onExitSelectMode: exitSelectMode,
  })

  /** 选中数驱动选择模式进出：0→N 进入；N→0 自动退出（取消最后一项等） */
  watch(() => props.checkeds.size, (size, prev) => {
    if (prev === 0 && size > 0)
      selectMode.value = true
    if (prev > 0 && size === 0)
      exitSelectMode()
  })

  function exitSelectMode() {
    selectMode.value = false
    props.onCheckedClear()
    selection.resetAnchor()
  }

  const handleContextmenu = (item: Share.Entity.FilesItem, e: MouseEvent) => {
    contextmenuShow.value = true
    contextmenuPosition.value = {
      x: e.clientX,
      y: e.clientY,
    }

    // 多选已存在：确保右键项被选中（不清空）；否则 radio 单选该项。
    // 不走 selection.handleClick——其默认态分支会触发 onOpen 打开文件
    if (props.checkeds.size <= 1)
      props.onCheckedClear()
    props.onChecked(item, true)
  }

  /** 拖拽激活时惰性求值：自动勾选当前项后返回全集（呼应 DndSource 的惰性 payload）。 */
  const dragPayload = (item: Share.Entity.FilesItem) => () => {
    if (!props.checkeds.has(item))
      props.onChecked(item, true)
    return props.checkeds.size > 0 ? Array.from(props.checkeds) : [item]
  }

  const itemProps = (item: Share.Entity.FilesItem, dragging: boolean) => ({
    'data-selection-key': item.pc,
    'checked': props.checkeds.has(item),
    'data': item,
    'dragging': dragging && props.checkeds.has(item),
    'pathSelect': props.pathSelect,
    'onChecked': (checked: boolean) => props.onChecked?.(item, checked),
    'onClick': () => selection.handleClick(item),
    'onContextmenu': (e: MouseEvent) => handleContextmenu(item, e),
    'dragPayload': dragPayload(item),
    'onDragMove': (cid: string, items: Share.Entity.FilesItem[]) => props.onDragMove?.(cid, items),
  })

  return {
    containerRef,
    selectMode,
    exitSelectMode,
    contextmenuShow,
    contextmenuPosition,
    itemProps,
    resetAnchor: selection.resetAnchor,
  }
}

export function useFilePreview(props: { listData: Share.Entity.FilesItem[] }) {
  const images = computed(() => {
    return props.listData?.filter(i => Boolean(i.u))
  })

  const preview = (item: Share.Entity.FilesItem) => {
    const realIndex = images.value?.findIndex(i => i.pc === item.pc)
    const dataSource = images.value?.map((item, index) => {
      return {
        src: Utils115.getScaleThumbnail(item.u, 0),
        thumbSrc: item.u,
        caption: item.n,
        index: images.value?.length ?? 0 - index,
      }
    })
    Fancybox.show(dataSource, {
      startIndex: realIndex,
      mainStyle: {
        '--fancybox-backdrop-bg': 'rgba(0, 0, 0, 1)',
      },
      Carousel: {
        transition: 'crossfade',
        Lazyload: {
          showLoading: true,
          preload: 30,
        },
        Toolbar: {
          display: {
            left: ['counter'],
            right: ['autoplay', 'thumbs', 'download', 'fullscreen', 'close'],
          },
        },
      },
      idle: 1000,
    })
  }

  return { preview }
}
