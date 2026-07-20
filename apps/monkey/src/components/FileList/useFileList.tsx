import type { Share } from '@115master/drive115'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { computed, ref, shallowRef, watch } from 'vue'
import { useListSelection } from '@/hooks/useListSelection'
import { Utils115 } from '@/utils/utils115'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

function createDragImage(count: number): HTMLElement {
  const el = document.createElement('div')
  el.className = [
    'flex items-center justify-center',
    'bg-primary text-primary-content',
    'rounded-lg shadow-lg',
    'px-4 py-2',
    'text-sm font-medium',
    'min-w-24',
  ].join(' ')
  el.textContent = count === 1 ? '移动1个文件' : `移动${count}个文件`

  el.style.color = 'var(--color-base-100)'
  el.style.backgroundColor = 'var(--color-base-content)'
  el.style.position = 'absolute'
  el.style.pointerEvents = 'none'
  el.style.zIndex = '9999'

  return el
}

export interface FileListInteractionProps {
  pathSelect: boolean
  listData: Share.Entity.FilesItem[]
  checkeds: Set<Share.Entity.FilesItem>
  onChecked: (item: Share.Entity.FilesItem, checked: boolean) => void
  onCheckedClear: () => void
  /** 默认态（非选择模式）plain click 打开该项 */
  onOpen?: (item: Share.Entity.FilesItem) => void
  onDragStart?: (items: Share.Entity.FilesItem[], event: DragEvent) => void
  onDragMove?: (cid: string, items: Share.Entity.FilesItem[]) => void
  /** 框选容器，缺省取列表网格容器 */
  marqueeContainer?: () => HTMLElement | undefined
}

export function useFileList(props: FileListInteractionProps) {
  const containerRef = ref<HTMLElement>()
  const dragging = shallowRef(false)
  const selectMode = shallowRef(false)
  const contextmenuShow = shallowRef(false)
  const contextmenuPosition = shallowRef({ x: 0, y: 0 })

  /** 通用多选交互（框选 + 点击 + Shift/Meta·Ctrl + ESC/Cmd·Ctrl+A） */
  const selection = useListSelection<Share.Entity.FilesItem>({
    container: () => props.marqueeContainer?.() ?? containerRef.value,
    list: () => props.listData,
    key: item => item.pc,
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

  /** 首个选中产生 → 进入选择模式（选中归零不自动退出，退出靠 exitSelectMode） */
  watch(() => props.checkeds.size, (size, prev) => {
    if (prev === 0 && size > 0)
      selectMode.value = true
  })

  function exitSelectMode() {
    selectMode.value = false
    props.onCheckedClear()
    selection.resetAnchor()
  }

  const handleDragStart = (item: Share.Entity.FilesItem, event: DragEvent) => {
    if (!event.dataTransfer)
      return

    dragging.value = true

    if (!props.checkeds.has(item))
      props.onChecked(item, true)

    const selected = props.checkeds.size > 0
      ? Array.from(props.checkeds)
      : [item]

    event.dataTransfer.setData('application/json', JSON.stringify(selected))
    event.dataTransfer.effectAllowed = 'move'

    const dragImage = createDragImage(selected.length)
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 50, 20)
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)

    props.onDragStart?.(selected, event)
  }

  const handleDragEnd = () => {
    dragging.value = false
  }

  const handleDrop = (item: Share.Entity.FilesItem, event: DragEvent) => {
    if (item.fc !== 0)
      return

    const data = event.dataTransfer?.getData('application/json')
    if (!data)
      return

    const items = JSON.parse(data) as Share.Entity.FilesItem[]
    props.onDragMove?.(item.cid, items)
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

  const itemProps = (item: Share.Entity.FilesItem) => ({
    'data-selection-key': item.pc,
    'checked': props.checkeds.has(item),
    'data': item,
    'dragging': dragging.value && props.checkeds.has(item),
    'pathSelect': props.pathSelect,
    'onChecked': (checked: boolean) => props.onChecked?.(item, checked),
    'onClick': () => selection.handleClick(item),
    'onContextmenu': (e: MouseEvent) => handleContextmenu(item, e),
    'onDragEnd': handleDragEnd,
    'onDragStart': (event: DragEvent) => handleDragStart(item, event),
    'onDrop': (event: DragEvent) => handleDrop(item, event),
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
