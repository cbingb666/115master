import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent, withModifiers } from 'vue'
import { useContextmenu } from '@/hooks/useContextmenu'
import { ICON_TOP_SOLID } from '@/icons'
import { Link } from '../Link'
import FileItemCheckbox from './FileItemCheckbox'
import FileItemContent from './FileItemContent'
import FileItemThumbnail from './FileItemThumbnail'
import { useFileItem } from './useFileItem'

const FileItem = defineComponent({
  name: 'FileItem',
  props: {
    viewType: {
      type: String as PropType<'card' | 'list'>,
      default: 'list',
    },
    data: {
      type: Object as PropType<WebApi.Entity.FilesItem>,
      required: true,
    },
    pathSelect: {
      type: Boolean,
      default: false,
    },
    checked: {
      type: Boolean,
      default: false,
    },
    dragging: {
      type: Boolean,
      default: false,
    },
    onClick: {
      type: Function as PropType<(data: WebApi.Entity.FilesItem) => void>,
      default: () => {},
    },
    onChecked: {
      type: Function as PropType<(checked: boolean) => void>,
      default: () => {},
    },
    onRadio: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    onDragStart: {
      type: Function as PropType<(event: DragEvent) => void>,
      default: () => {},
    },
    onDragEnd: {
      type: Function as PropType<(event: DragEvent) => void>,
      default: () => {},
    },
    onDrop: {
      type: Function as PropType<(event: DragEvent) => void>,
      default: () => {},
    },
    onContextmenu: {
      type: Function as PropType<(event: MouseEvent) => void>,
      default: () => {},
    },
    onPreview: {
      type: Function as PropType<(data: WebApi.Entity.FilesItem) => void>,
      default: () => {},
    },
  },
  setup: (props) => {
    const {
      itemRef,
      isDrogzone,
      isDragging: itemDragging,
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
    } = useFileItem({
      data: props.data,
      pathSelect: props.pathSelect,
      onPreview: props.onPreview,
    })

    function handleClick(e: Event) {
      // 路径选择模式
      if (props.pathSelect) {
        props.onClick?.(props.data)
        return
      }

      // 非信任点击（自动化点击），直接打开
      if (!e.isTrusted) {
        open()
        return
      }

      props.onClick?.(props.data)
    }

    function handleDblClick() {
      if (props.pathSelect)
        // 路径选择模式禁止双击打开
        return
      open()
    }

    function handleMouseDown(e: MouseEvent) {
      e.stopPropagation()
    }

    useContextmenu(itemRef, (e) => {
      props.onContextmenu?.(e)
    })

    return () => (
      <div
        ref={itemRef}
        class="
          group
          data-[checked=true]:bg-secondary/60! data-[checked=true]:ring-secondary/60
          data-[checked=true]:hover:bg-secondary/80!
          data-[checked=true]:hover:ring-secondary/80!
          data-[dropzone=true]:bg-secondary/90
          relative
          flex
          min-w-0
          rounded-lg
          hover:bg-neutral-500/10
          data-[checked=true]:bg-linear-to-br
          data-[dragging=true]:opacity-30
          data-[view-type=card]:h-full
          data-[view-type=card]:flex-col
          data-[view-type=card]:rounded-2xl
          data-[view-type=card]:data-[checked=true]:ring-6
          data-[view-type=list]:items-stretch
          data-[view-type=list]:hover:bg-neutral-500/10
        "
        data-checked={props.checked}
        data-dragging={props.dragging}
        data-dropzone={isDrogzone.value}
        data-view-type={props.viewType}
        onDragleave={handleDragLeave}
        onDragover={handleDragOver}
        onDrop={e => handleDrop(e as DragEvent, props.onDrop)}
      >
        {/* 复选框 */}
        <FileItemCheckbox
          checked={props.checked}
          pathSelect={props.pathSelect}
          onChecked={props.onChecked}
          onEnter={open}
        />

        {/* 链接区域 */}
        <Link
          class="
            cursor-default
            group-data-[view-type=card]:flex group-data-[view-type=card]:min-w-0
            group-data-[view-type=card]:flex-1 group-data-[view-type=card]:flex-col
            group-data-[view-type=list]:flex group-data-[view-type=list]:min-w-0
            group-data-[view-type=list]:flex-1 group-data-[view-type=list]:items-center
            group-data-[view-type=list]:gap-4 group-data-[view-type=list]:py-3
          "
          {...link.value}
          draggable={false}
          onClickCapture={withModifiers(handleClick, ['prevent'])}
          onDblclick={handleDblClick}
        >
          {/* 缩略图容器 */}
          <span
            class="
              group-data-[view-type=card]:bg-base-content/3 flex items-center
              justify-center group-data-[view-type=card]:relative
              group-data-[view-type=card]:aspect-video group-data-[view-type=card]:w-full
              group-data-[view-type=card]:rounded-2xl
              group-data-[view-type=list]:relative group-data-[view-type=list]:size-14
            "
            onDragend={(e) => {
              itemDragging.value = false
              props.onDragEnd?.(e as DragEvent)
            }}
            onDragstart={(e) => {
              e.stopPropagation()
              itemDragging.value = true
              props.onDragStart?.(e as DragEvent)
            }}
          >
            <FileItemThumbnail
              data={props.data}
              isFolder={isFolder.value}
              isVideo={isVideo.value}
              emoji={emoji.value}
              actressUrl={hasActressCover.value ? actressAsyncState.state.value?.url : undefined}
              videoCover={hasVideoCover.value ? videoCoverResult?.videoCover.state[0] : undefined}
              hasImagePreview={hasImagePreview.value}
              onMouseDown={handleMouseDown}
            />

            {/* 置顶图标 */}
            <Icon
              class="
                size-5 text-orange-500
                group-data-[view-type=card]:absolute group-data-[view-type=card]:top-3
                group-data-[view-type=card]:right-3 group-data-[view-type=card]:size-6
                group-data-[view-type=list]:absolute group-data-[view-type=list]:-top-1
                group-data-[view-type=list]:-left-2 group-data-[view-type=list]:-rotate-45
              "
              v-show={props.data.is_top}
              icon={ICON_TOP_SOLID}
            />
          </span>

          {/* 内容区域 */}
          <FileItemContent
            data={props.data}
            pathSelect={props.pathSelect}
          />
        </Link>
      </div>
    )
  },
})

export default FileItem
