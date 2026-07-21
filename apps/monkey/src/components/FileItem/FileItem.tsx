import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { defineComponent, withModifiers } from 'vue'
import { useContextmenu } from '@/hooks/useContextmenu'
import { useLongPress } from '@/hooks/useLongPress'
import { Link } from '../Link'
import FileItemCheckbox from './FileItemCheckbox'
import FileItemContent from './FileItemContent'
import FileItemThumbnail from './FileItemThumbnail'
import { useFileItem } from './useFileItem'

const FileItem = defineComponent({
  name: 'FileItem',
  inheritAttrs: true,
  props: {
    viewType: {
      type: String as PropType<'card' | 'list'>,
      default: 'list',
    },
    data: {
      type: Object as PropType<Share.Entity.FilesItem>,
      required: true,
    },
    pathSelect: {
      type: Boolean,
      default: false,
    },
    selectMode: {
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
      type: Function as PropType<(data: Share.Entity.FilesItem) => void>,
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
      type: Function as PropType<(data: Share.Entity.FilesItem) => void>,
      default: () => {},
    },
    /** 文件夹 CID（用于图片预览） */
    cid: {
      type: String,
      default: undefined,
    },
    /** 排序字段 */
    order: {
      type: String as PropType<Share.Base.Sorter['o']>,
      default: undefined,
    },
    /** 是否升序 */
    asc: {
      type: Number as PropType<Share.Base.Sorter['asc']>,
      default: undefined,
    },
  },
  setup: (props, { slots, attrs }) => {
    const {
      itemRef,
      isDrogzone,
      isDragging: itemDragging,
      isVideo,
      isFolder,
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
      cid: props.cid,
      order: props.order,
      asc: props.asc,
      onPreview: props.onPreview,
    })

    /** 移动端长按：选中该项（watch count 自动进入选择模式）；鼠标不触发 */
    const longPressFired = useLongPress(itemRef, {
      onTrigger: () => {
        if (!props.checked)
          props.onChecked(true)
      },
    })

    function handleClick(e: Event) {
      // 长按刚触发（进入选择模式），吞掉随后合成的 click，避免又触发单击打开
      if (longPressFired.value) {
        longPressFired.value = false
        return
      }
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

    function handleMouseDown(e: MouseEvent) {
      e.stopPropagation()
    }

    useContextmenu(itemRef, (e) => {
      props.onContextmenu?.(e)
    })

    return () => (
      <div
        ref={itemRef}
        class={[
          `
            group data-[checked=true]:bg-primary/10! data-[checked=true]:ring-primary/10
            data-[checked=true]:hover:bg-primary/15! data-[checked=true]:hover:ring-primary/15!
            data-[dropzone=true]:bg-primary/10
            data-[dropzone=true]:ring-primary
            hover:bg-base-content/5
            data-[view-type=list]:even:bg-base-content/[0.03]
            data-[view-type=list]:hover:bg-base-content/5
            dark:data-[view-type=list]:even:bg-base-content/5
            dark:data-[view-type=list]:hover:bg-base-content/10
            relative
            flex
            min-w-0
            rounded-xs
            transition
            data-[checked=true]:bg-linear-to-br
            data-[dragging=true]:opacity-30
            data-[dropzone=true]:ring-2
            data-[dropzone=true]:ring-inset
            data-[view-type=card]:h-full
            data-[view-type=card]:flex-col
            data-[view-type=card]:rounded-2xl
            data-[view-type=card]:data-[checked=true]:ring-6
            data-[view-type=list]:items-stretch
            max-sm:select-none
            max-sm:[-webkit-touch-callout:none]
          `,
          attrs.class,
        ]}
        data-checked={props.checked}
        data-dragging={props.dragging}
        data-dropzone={isDrogzone.value}
        data-select-mode={props.selectMode}
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
            group-data-[view-type=list]:gap-3 group-data-[view-type=list]:py-1
          "
          {...link.value}
          draggable={false}
          onClickCapture={withModifiers(handleClick, ['prevent'])}
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
            {slots.thumbnail?.({
              data: props.data,
              isFolder: isFolder.value,
              isVideo: isVideo.value,
              actressUrl: hasActressCover.value ? actressAsyncState.state.value?.url : undefined,
              videoCover: hasVideoCover.value ? videoCoverResult?.videoCover.state[0] : undefined,
              hasImagePreview: hasImagePreview.value,
              onMouseDown: handleMouseDown,
            }) ?? (
              <FileItemThumbnail
                data={props.data}
                isFolder={isFolder.value}
                isVideo={isVideo.value}
                actressUrl={hasActressCover.value ? actressAsyncState.state.value?.url : undefined}
                videoCover={hasVideoCover.value ? videoCoverResult?.videoCover.state[0] : undefined}
                hasImagePreview={hasImagePreview.value}
                onMouseDown={handleMouseDown}
              />
            )}
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
