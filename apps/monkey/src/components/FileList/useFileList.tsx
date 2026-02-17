import type { WebApi } from '@115master/drive115'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { useMagicKeys } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { useMarqueeSelect } from '@/hooks/useMarqueeSelect'
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

  el.style.color = '#fff'
  el.style.backgroundColor = 'rgba(55,55,55,0.8)'
  el.style.position = 'absolute'
  el.style.pointerEvents = 'none'
  el.style.zIndex = '9999'

  return el
}

export interface FileListInteractionProps {
  pathSelect: boolean
  listData: WebApi.Entity.FilesItem[]
  checkeds: Set<WebApi.Entity.FilesItem>
  onChecked: (item: WebApi.Entity.FilesItem, checked: boolean) => void
  onCheckedClear: () => void
  onRadio: (item: WebApi.Entity.FilesItem) => void
  onDragStart?: (items: WebApi.Entity.FilesItem[], event: DragEvent) => void
  onDragMove?: (cid: string, items: WebApi.Entity.FilesItem[]) => void
}

export function useFileList(props: FileListInteractionProps) {
  const containerRef = ref<HTMLElement>()
  const dragging = shallowRef(false)
  const contextmenuShow = shallowRef(false)
  const contextmenuPosition = shallowRef({ x: 0, y: 0 })

  const keys = useMagicKeys({
    target: () => containerRef.value!,
    passive: false,
    onEventFired: (e) => {
      e.preventDefault()
    },
  })

  const KeyMeta = keys.Meta
  const KeyShift = keys.Shift
  const KeyEscape = keys.Escape
  const KeyMetaA = keys['Meta+A']

  const lastCheckedIndex = ref<number>(-1)
  const currentFocusIndex = ref<number>(-1)

  useMarqueeSelect({
    container: () => containerRef.value,
    disabled: props.pathSelect,
  })

  const handleDragStart = (item: WebApi.Entity.FilesItem, event: DragEvent) => {
    if (!event.dataTransfer)
      return

    dragging.value = true

    if (!props.checkeds.has(item)) {
      props.onChecked(item, true)
      if (props.listData) {
        const currentIndex = props.listData.findIndex(data => data.pc === item.pc)
        lastCheckedIndex.value = currentIndex
      }
    }

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

  const handleDragEnd = (_item: WebApi.Entity.FilesItem, _event: DragEvent) => {
    dragging.value = false
  }

  const handleDrop = (item: WebApi.Entity.FilesItem, event: DragEvent) => {
    const data = event.dataTransfer?.getData('application/json')
    if (!data)
      return

    const items = JSON.parse(data) as WebApi.Entity.FilesItem[]
    props.onDragMove?.(item.cid, items)
  }

  const handleContextmenu = (item: WebApi.Entity.FilesItem, e: MouseEvent) => {
    contextmenuShow.value = true
    contextmenuPosition.value = {
      x: e.clientX,
      y: e.clientY,
    }

    if (props.checkeds.size > 1) {
      props.onChecked(item, true)
      if (props.listData) {
        const currentIndex = props.listData.findIndex(data => data.pc === item.pc)
        lastCheckedIndex.value = currentIndex
      }
    }
    else {
      props.onRadio?.(item)
    }
  }

  const handleClick = (item: WebApi.Entity.FilesItem) => {
    if (!props.listData)
      return

    const currentIndex = props.listData.findIndex(data => data.pc === item.pc)

    if (KeyShift.value && lastCheckedIndex.value !== -1) {
      const startIndex = Math.min(lastCheckedIndex.value, currentIndex)
      const endIndex = Math.max(lastCheckedIndex.value, currentIndex)

      for (let i = startIndex; i <= endIndex; i++) {
        const targetItem = props.listData[i]
        if (targetItem && !props.checkeds.has(targetItem)) {
          props.onChecked(targetItem, true)
        }
      }

      lastCheckedIndex.value = currentIndex
    }
    else if (KeyMeta.value) {
      const isChecked = props.checkeds.has(item)
      props.onChecked(item, !isChecked)

      if (!isChecked) {
        lastCheckedIndex.value = currentIndex
      }
    }
    else {
      props.onRadio?.(item)
      lastCheckedIndex.value = currentIndex
    }
  }

  /** 监听 esc 键，取消选中 */
  watch(KeyEscape, (value) => {
    if (value) {
      props.onCheckedClear?.()
      contextmenuShow.value = false
      lastCheckedIndex.value = -1
      currentFocusIndex.value = -1
    }
  })

  /** 监听 meta+a 键，全选 */
  watch(KeyMetaA, (value) => {
    if (value) {
      props.listData?.forEach((item) => {
        props.onChecked(item, true)
      })
    }
  })

  const itemProps = (item: WebApi.Entity.FilesItem) => ({
    'data-selection-key': item.pc,
    'checked': props.checkeds.has(item),
    'data': item,
    'dragging': dragging.value && props.checkeds.has(item),
    'pathSelect': props.pathSelect,
    'onChecked': (checked: boolean) => props.onChecked?.(item, checked),
    'onClick': () => handleClick(item),
    'onContextmenu': (e: MouseEvent) => handleContextmenu(item, e),
    'onDragEnd': (event: DragEvent) => handleDragEnd(item, event),
    'onDragStart': (event: DragEvent) => handleDragStart(item, event),
    'onDrop': (event: DragEvent) => handleDrop(item, event),
    'onRadio': () => props.onRadio?.(item),
  })

  return {
    containerRef,
    contextmenuShow,
    contextmenuPosition,
    itemProps,
  }
}

export function useFilePreview(props: { listData: WebApi.Entity.FilesItem[] }) {
  const images = computed(() => {
    return props.listData?.filter(i => Boolean(i.u))
  })

  const preview = (item: WebApi.Entity.FilesItem) => {
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
