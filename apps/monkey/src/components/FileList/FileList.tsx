import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import type { Action } from '@/types/action'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { useMagicKeys } from '@vueuse/core'
import { computed, defineComponent, ref, shallowRef, watch } from 'vue'
import { useMarqueeSelect } from '@/hooks/useMarqueeSelect'
import { Utils115 } from '@/utils/utils115'
import { FileContextMenu, FileListItem } from '..'
import { useFileListProvide } from './provide'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

function createDragImage(count: number): HTMLElement {
  const dragElement = document.createElement('div')
  dragElement.className = [
    'flex items-center justify-center',
    'bg-primary text-primary-content',
    'rounded-lg shadow-lg',
    'px-4 py-2',
    'text-sm font-medium',
    'min-w-24',
  ].join(' ')
  dragElement.textContent = count === 1 ? '移动1个文件' : `移动${count}个文件`

  // 设置样式使其在拖拽时可见
  dragElement.style.color = '#fff'
  dragElement.style.backgroundColor = 'rgba(55,55,55,0.8)'
  dragElement.style.position = 'absolute'
  dragElement.style.pointerEvents = 'none'
  dragElement.style.zIndex = '9999'

  return dragElement
}

const FileList = defineComponent({
  name: 'FileList',
  props: {
    viewType: {
      type: String as PropType<'card' | 'list'>,
      default: 'list',
    },
    pathSelect: {
      type: Boolean,
      default: false,
    },
    listData: {
      type: Array as PropType<WebApi.Entity.FilesItem[]>,
      required: true,
    },
    checkeds: {
      type: Object as PropType<Set<WebApi.Entity.FilesItem>>,
      default: () => new Set(),
    },
    actionConfig: {
      type: Array as PropType<Action[][]>,
      default: () => [],
      required: true,
    },
    onChecked: {
      type: Function as PropType<(item: WebApi.Entity.FilesItem, checked: boolean) => void>,
      default: () => {},
    },
    onCheckedClear: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    onRadio: {
      type: Function as PropType<(item: WebApi.Entity.FilesItem) => void>,
      default: () => {},
    },
    onDragStart: {
      type: Function as PropType<(items: WebApi.Entity.FilesItem[], event: DragEvent) => void>,
      default: () => {},
    },
    onDragMove: {
      type: Function as PropType<(cid: string, items: WebApi.Entity.FilesItem[]) => void>,
      default: () => {},
    },
    onPreview: {
      type: Function as PropType<(item: WebApi.Entity.FilesItem) => void>,
      default: () => {},
    },
  },
  setup: (props) => {
    const { viewType, contextmenuPosition, contextmenuShow } = useFileListProvide(props)

    const containerRef = ref<HTMLElement>()

    const dragging = shallowRef(false)

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

    const listDataWithImage = computed(() => {
      return props.listData?.filter(i => Boolean(i.u))
    })

    useMarqueeSelect({
      container: () => containerRef.value,
      disabled: props.pathSelect, // 路径选择模式下禁用框
    })

    const handleDragStart = (item: WebApi.Entity.FilesItem, event: DragEvent) => {
      if (!event.dataTransfer)
        return

      dragging.value = true

      // 如果当前项没有被选中，先选中它
      if (!props.checkeds.has(item)) {
        props.onChecked(item, true)
        if (props.listData) {
          const currentIndex = props.listData.findIndex(data => data.pc === item.pc)
          lastCheckedIndex.value = currentIndex
        }
      }

      const selectedItems = props.checkeds.size > 0
        ? Array.from(props.checkeds)
        : [item]

      event.dataTransfer.setData('application/json', JSON.stringify(selectedItems))
      event.dataTransfer.effectAllowed = 'move'

      const dragImage = createDragImage(selectedItems.length)
      document.body.appendChild(dragImage)

      event.dataTransfer.setDragImage(dragImage, 50, 20)

      setTimeout(() => {
        document.body.removeChild(dragImage)
      }, 0)

      props.onDragStart?.(selectedItems, event)
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

    const previewByFancybox = (item: WebApi.Entity.FilesItem, _index: number) => {
      const realIndex = listDataWithImage.value?.findIndex(i => i.pc === item.pc)
      const dataSource = listDataWithImage.value?.map((item, index) => {
        return {
          src: Utils115.getScaleThumbnail(item.u, 0),
          thumbSrc: item.u,
          caption: item.n,
          index: listDataWithImage.value?.length ?? 0 - index,
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

    const handlePreview = async (item: WebApi.Entity.FilesItem, _index: number) => {
      previewByFancybox(item, _index)
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

    return () => (
      <div
        ref={containerRef}
        class={[
          'relative w-full px-5 pt-5 pb-28 focus-within:outline-none',
          // card
          'data-[view-type=card]:grid data-[view-type=card]:grid-cols-2',
          'data-[view-type=card]:items-stretch data-[view-type=card]:gap-3',
          // list
          'data-[view-type=list]:grid data-[view-type=list]:w-full',
          'data-[view-type=list]:grid-cols-1 data-[view-type=list]:gap-1',
          // card
          'data-[view-type=card]:sm:grid-cols-2 data-[view-type=card]:sm:gap-5',
          'data-[view-type=card]:lg:grid-cols-3',
          'data-[view-type=card]:xl:grid-cols-4',
          'data-[view-type=card]:2xl:grid-cols-5',
        ].join(' ')}
        data-view-type={viewType.value}
        tabindex="0"
      >
        {
          props.listData?.map((item, index) => (
            <div
              key={item.pc}
              data-selection-key={item.pc}
            >
              <FileListItem
                checked={props.checkeds.has(item)}
                data={item}
                dragging={dragging.value && props.checkeds.has(item)}
                pathSelect={props.pathSelect}
                onChecked={checked => props.onChecked?.(item, checked)}
                onClick={() => handleClick(item)}
                onContextmenu={e => handleContextmenu(item, e)}
                onDragEnd={event => handleDragEnd(item, event)}
                onDragStart={event => handleDragStart(item, event)}
                onDrop={event => handleDrop(item, event)}
                onPreview={() => handlePreview(item, index)}
                onRadio={() => props.onRadio?.(item)}
              />
            </div>
          ))
        }

        <FileContextMenu
          actionConfig={props.actionConfig}
          position={contextmenuPosition.value}
          show={contextmenuShow.value}
          onClose={() => contextmenuShow.value = false}
        />
      </div>
    )
  },
})

export default FileList
