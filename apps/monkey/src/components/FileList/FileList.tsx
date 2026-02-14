import type { PropType } from 'vue'
import type { Action } from '@/types/action'
import type { WebApi } from '@/utils/drive115/api'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { useMagicKeys } from '@vueuse/core'
import { computed, defineComponent, ref, shallowRef, watch } from 'vue'
import { useMarqueeSelect } from '@/hooks/useMarqueeSelect'
import { clsx } from '@/utils/clsx'
import { Utils115 } from '@/utils/utils115'
import { FileContextmenu, FileListItem } from '..'
import { useFileListProvide } from './provide'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const styles = clsx({
  root: [
    'relative',
    'w-full',
    'px-5',
    'pt-5',
    'pb-28',
    'focus-within:outline-none',
    // 列表模式
    'data-[view-type=list]:grid',
    'data-[view-type=list]:grid-cols-1',
    'data-[view-type=list]:gap-1',
    'data-[view-type=list]:w-full',
    // 卡片模式
    'data-[view-type=card]:grid',
    'data-[view-type=card]:grid-cols-2',
    'data-[view-type=card]:sm:grid-cols-2',
    'data-[view-type=card]:lg:grid-cols-3',
    'data-[view-type=card]:xl:grid-cols-4',
    'data-[view-type=card]:2xl:grid-cols-5',
    'data-[view-type=card]:items-stretch', // 让所有项目拉伸到相同高度
    'data-[view-type=card]:gap-3',
    'data-[view-type=card]:sm:gap-5',
  ],

  // 拖拽图像样式
  dragImage: [
    'flex items-center justify-center',
    'bg-primary text-primary-content',
    'rounded-lg shadow-lg',
    'px-4 py-2',
    'text-sm font-medium',
    'min-w-24',
  ],
})

export const props = {
  /** 视图类型 */
  viewType: {
    type: String as PropType<'card' | 'list'>,
    default: 'list',
  },
  /** 路径选择模式 */
  pathSelect: {
    type: Boolean,
    default: false,
  },
  /** 列表数据 */
  listData: {
    type: Array as PropType<WebApi.Entity.FilesItem[]>,
    required: true,
  },
  /** 选中的文件 */
  checkeds: {
    type: Object as PropType<Set<WebApi.Entity.FilesItem>>,
    default: () => new Set(),
  },
  /** 操作配置 */
  actionConfig: {
    type: Array as PropType<Action[][]>,
    default: () => [],
    required: true,
  },
  /** 选中文件 */
  onChecked: {
    type: Function as PropType<(item: WebApi.Entity.FilesItem, checked: boolean) => void>,
    default: () => {},
  },
  /** 清除选中文件 */
  onCheckedClear: {
    type: Function as PropType<() => void>,
    default: () => {},
  },
  /** 单选 */
  onRadio: {
    type: Function as PropType<(item: WebApi.Entity.FilesItem) => void>,
    default: () => {},
  },
  // 新增拖拽相关事件
  onDragStart: {
    type: Function as PropType<(items: WebApi.Entity.FilesItem[], event: DragEvent) => void>,
    default: () => {},
  },
  /** 拖拽移动事件 */
  onDragMove: {
    type: Function as PropType<(cid: string, items: WebApi.Entity.FilesItem[]) => void>,
    default: () => {},
  },
  /** 预览事件 */
  onPreview: {
    type: Function as PropType<(item: WebApi.Entity.FilesItem) => void>,
    default: () => {},
  },
}

/**
 * 创建拖拽图像
 */
function createDragImage(count: number): HTMLElement {
  const dragElement = document.createElement('div')
  dragElement.className = styles.dragImage.join(' ')
  dragElement.textContent = count === 1 ? '移动1个文件' : `移动${count}个文件`

  // 设置样式使其在拖拽时可见
  dragElement.style.color = '#fff'
  dragElement.style.backgroundColor = 'rgba(55,55,55,0.8)'
  dragElement.style.position = 'absolute'
  dragElement.style.pointerEvents = 'none'
  dragElement.style.zIndex = '9999'

  return dragElement
}

/**
 * 文件列表
 */
const FileList = defineComponent({
  name: 'FileList',
  props,
  setup: (props) => {
    const { viewType, contextmenuPosition, contextmenuShow } = useFileListProvide(props)

    /** 容器引用 */
    const containerRef = ref<HTMLElement>()

    /** 是否拖拽中 */
    const dragging = shallowRef(false)

    /** 快捷键 */
    const keys = useMagicKeys({
      target: () => containerRef.value!,
      passive: false,
      onEventFired: (e) => {
        e.preventDefault()
      },
    })

    /** 快捷键：Meta */
    const KeyMeta = keys.Meta

    /** 快捷键：Shift */
    const KeyShift = keys.Shift

    /** 快捷键：Escape */
    const KeyEscape = keys.Escape

    /** 快捷键：Meta + A */
    const KeyMetaA = keys['Meta+A']

    /** 最后一个被选中的项目索引 */
    const lastCheckedIndex = ref<number>(-1)

    /** 当前焦点项目索引 */
    const currentFocusIndex = ref<number>(-1)

    /** 框选功能 */
    useMarqueeSelect({
      container: () => containerRef.value,
      disabled: props.pathSelect, // 路径选择模式下禁用框
    })

    /**
     * 处理拖拽开始事件
     */
    const handleDragStart = (item: WebApi.Entity.FilesItem, event: DragEvent) => {
      if (!event.dataTransfer)
        return

      dragging.value = true

      // 如果当前项没有被选中，先选中它
      if (!props.checkeds.has(item)) {
        props.onChecked(item, true)
        // 更新最后选中的索引
        if (props.listData) {
          const currentIndex = props.listData.findIndex(data => data.pc === item.pc)
          lastCheckedIndex.value = currentIndex
        }
      }

      /** 获取所有选中的项目，如果没有选中项则使用当前项 */
      const selectedItems = props.checkeds.size > 0
        ? Array.from(props.checkeds)
        : [item]

      /** 设置拖拽数据 */
      event.dataTransfer.setData('application/json', JSON.stringify(selectedItems))
      event.dataTransfer.effectAllowed = 'move'

      /** 创建自定义拖拽图像 */
      const dragImage = createDragImage(selectedItems.length)
      document.body.appendChild(dragImage)

      // 设置拖拽图像
      event.dataTransfer.setDragImage(dragImage, 50, 20)

      // 清理拖拽图像元素
      setTimeout(() => {
        document.body.removeChild(dragImage)
      }, 0)

      // 触发父组件的拖拽开始事件
      props.onDragStart?.(selectedItems, event)
    }

    /** 拖拽结束 */
    const handleDragEnd = (_item: WebApi.Entity.FilesItem, _event: DragEvent) => {
      dragging.value = false
    }

    /** 放置事件 */
    const handleDrop = (item: WebApi.Entity.FilesItem, event: DragEvent) => {
      const data = event.dataTransfer?.getData('application/json')
      if (!data)
        return

      const items = JSON.parse(data) as WebApi.Entity.FilesItem[]
      props.onDragMove?.(item.cid, items)
    }

    /** 右键菜单 */
    const handleContextmenu = (item: WebApi.Entity.FilesItem, e: MouseEvent) => {
      contextmenuShow.value = true
      contextmenuPosition.value = {
        x: e.clientX,
        y: e.clientY,
      }

      if (props.checkeds.size > 1) {
        props.onChecked(item, true)
        // 更新最后选中的索引
        if (props.listData) {
          const currentIndex = props.listData.findIndex(data => data.pc === item.pc)
          lastCheckedIndex.value = currentIndex
        }
      }
      else {
        props.onRadio?.(item)
      }
    }

    /** 点击事件 */
    const handleClick = (item: WebApi.Entity.FilesItem) => {
      if (!props.listData)
        return

      const currentIndex = props.listData.findIndex(data => data.pc === item.pc)

      if (KeyShift.value && lastCheckedIndex.value !== -1) {
        /** Shift + 点击：范围选择 */
        const startIndex = Math.min(lastCheckedIndex.value, currentIndex)
        const endIndex = Math.max(lastCheckedIndex.value, currentIndex)

        // 将范围内的所有项目设置为选中状态
        for (let i = startIndex; i <= endIndex; i++) {
          const targetItem = props.listData[i]
          if (targetItem && !props.checkeds.has(targetItem)) {
            props.onChecked(targetItem, true)
          }
        }

        lastCheckedIndex.value = currentIndex
      }
      else if (KeyMeta.value) {
        /** Meta + 点击：切换选中状态 */
        const isChecked = props.checkeds.has(item)
        props.onChecked(item, !isChecked)

        // 更新最后选中的索引
        if (!isChecked) {
          lastCheckedIndex.value = currentIndex
        }
      }
      else {
        // 普通点击：单选模式
        props.onRadio?.(item)
        lastCheckedIndex.value = currentIndex
      }
    }

    const listDataWithImage = computed(() => {
      return props.listData?.filter(i => Boolean(i.u))
    })

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

    /** 预览 */
    const handlePreview = async (item: WebApi.Entity.FilesItem, _index: number) => {
      previewByFancybox(item, _index)
    }

    /** 监听 esc 键，取消选中 */
    watch(KeyEscape, (value) => {
      if (value) {
        props.onCheckedClear?.()
        contextmenuShow.value = false
        lastCheckedIndex.value = -1 // 重置最后选中的索引
        currentFocusIndex.value = -1 // 重置焦点索引
      }
    })

    /** 监听 Meta + A 键, 全选 */
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
        class={styles.root}
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

        <FileContextmenu
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
