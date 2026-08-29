import type { Share } from '@115master/drive115'
import type { MaybeElement } from '@vueuse/core'
import type { PropType } from 'vue'
import type { FileDndSourceBindings, FileDndTargetBindings } from '../FileDnd'
import { unrefElement } from '@vueuse/core'
import { defineComponent, withModifiers } from 'vue'
import { useViewportVisibility } from '@/hooks/useViewportVisibility'
import { getFilesItemId } from '@/utils/filesItem'
import { FileDndSource, FileDndTarget } from '../FileDnd'
import { Link } from '../Link'
import FileItemCheckbox from './FileItemCheckbox'
import FileItemContent from './FileItemContent'
import FileItemThumbnail from './FileItemThumbnail'
import { useFileItem } from './useFileItem'

const FileItem = defineComponent({
  name: 'FileItem',
  inheritAttrs: false,
  props: {
    viewType: {
      type: String as PropType<'card' | 'list'>,
      default: 'list',
    },
    data: {
      type: Object as PropType<Share.Entity.FilesItem>,
      required: true,
    },
    index: {
      type: Number,
      default: 0,
    },
    setsize: {
      type: Number,
      default: 0,
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
      type: Function as PropType<(event: MouseEvent) => void>,
      default: () => {},
    },
    onChecked: {
      type: Function as PropType<(checked: boolean) => void>,
      default: () => {},
    },
    /** 拖拽激活时惰性求值被拖项（自动勾选当前项后返回全集） */
    dragPayload: {
      type: Function as PropType<() => Share.Entity.FilesItem[]>,
      default: undefined,
    },
    onDragMove: {
      type: Function as PropType<(cid: string, items: Share.Entity.FilesItem[]) => void>,
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
      isVideo,
      isFolder,
      link,
      hasActressCover,
      hasVideoCover,
      isVideoCoverLoading,
      hasImagePreview,
      actressAsyncState,
      videoCoverResult,
      open,
    } = useFileItem({
      data: props.data,
      cid: props.cid,
      order: props.order,
      asc: props.asc,
      onPreview: props.onPreview,
    })
    const inViewport = useViewportVisibility(itemRef)

    function handleClick(event: Event) {
      if (event.target instanceof Element && event.target.closest('[data-video-cover-error-action]')) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      props.onClick(event as MouseEvent)
    }

    function handleMouseDown(e: MouseEvent) {
      e.stopPropagation()
    }

    /** 触摸仅在多选态启用；路径选择模式保持禁用。 */
    function disabled(event: PointerEvent) {
      return props.pathSelect || (event.pointerType === 'touch' && !props.selectMode)
    }

    return () => (
      <FileDndTarget
        cid={getFilesItemId(props.data)}
        disabled={!isFolder.value}
        onDrop={items => props.onDragMove?.(getFilesItemId(props.data), items)}
      >
        {{ default: ({ targetProps, hovering }: { targetProps: FileDndTargetBindings, hovering: boolean }) => (
          <div
            {...attrs}
            ref={(value) => {
              itemRef.value = (unrefElement(value as MaybeElement) as HTMLElement | null | undefined) ?? undefined
              targetProps.ref(value)
            }}
            class={[
              `
            group data-[checked=true]:bg-primary/10! data-[checked=true]:ring-primary/10
            data-[checked=true]:hover:bg-primary/15! data-[checked=true]:hover:ring-primary/15!
            data-[dropzone=true]:bg-primary/10
            data-[dropzone=true]:ring-primary
            hover:bg-base-content/5
            data-[view-type=list]:data-[stripe=even]:bg-base-content/[0.03]
            data-[view-type=list]:hover:bg-base-content/5
            dark:data-[view-type=list]:data-[stripe=even]:bg-base-content/5
            dark:data-[view-type=list]:hover:bg-base-content/10
            relative
            flex
            min-w-0
            rounded-xs
            transition ease-[var(--ui-ease-standard)]
            data-[checked=true]:bg-linear-to-br
            data-[dragging=true]:opacity-30
            data-[dropzone=true]:ring-2
            data-[dropzone=true]:ring-inset
            data-[view-type=card]:flex-col
            data-[view-type=card]:rounded-lg
            data-[view-type=card]:data-[checked=true]:ring-6
            data-[view-type=list]:items-stretch
            data-[view-type=list]:overflow-x-clip
            max-sm:select-none
            max-sm:[-webkit-touch-callout:none]
          `,
              attrs.class,
            ]}
            data-checked={props.checked}
            data-dragging={props.dragging}
            data-dropzone={hovering}
            data-file-list-index={props.index}
            data-in-viewport={inViewport.value}
            data-select-mode={props.selectMode}
            data-stripe={props.index % 2 === 1 ? 'even' : 'odd'}
            data-view-type={props.viewType}
            aria-posinset={props.index + 1}
            aria-setsize={props.setsize || undefined}
            role="listitem"
            onContextmenu={event => props.onContextmenu(event)}
          >
            {/* 复选框 */}
            <FileItemCheckbox
              key={props.viewType}
              checked={props.checked}
              animate={inViewport.value}
              pathSelect={props.pathSelect}
              selectMode={props.selectMode}
              onChecked={props.onChecked}
              onEnter={open}
            />

            {/* 链接区域 */}
            <Link
              class={[
                `
            focus-visible:outline-primary
            cursor-default
            group-data-[select-mode=true]:cursor-pointer group-data-[view-type=card]:flex
            group-data-[view-type=card]:min-w-0 group-data-[view-type=card]:flex-1
            group-data-[view-type=card]:flex-col group-data-[view-type=list]:flex
            group-data-[view-type=list]:min-w-0 group-data-[view-type=list]:flex-1
            group-data-[view-type=list]:items-center group-data-[view-type=list]:gap-3
            group-data-[view-type=list]:py-1
            focus:outline-none focus-visible:outline-2
          `,
                inViewport.value
                  ? 'group-data-[view-type=list]:transition-[padding-left] group-data-[view-type=list]:duration-300 group-data-[view-type=list]:ease-out motion-reduce:transition-none'
                  : '',
                props.selectMode && props.viewType === 'list' ? 'pl-9' : '',
              ]}
              {...link.value}
              draggable={false}
              onClickCapture={withModifiers(handleClick, ['prevent'])}
            >
              {/* 缩略图容器 */}
              <FileDndSource
                items={() => props.dragPayload?.() ?? [props.data]}
                disabled={disabled}
              >
                {{ default: ({ sourceProps }: { sourceProps: FileDndSourceBindings }) => (
                  <span
                    class="
                  group-data-[view-type=card]:bg-base-content/3 flex items-center
                  justify-center group-data-[select-mode=true]:touch-none
                  group-data-[view-type=card]:relative group-data-[view-type=card]:aspect-video
                  group-data-[view-type=card]:w-full
                  group-data-[view-type=card]:rounded-lg group-data-[view-type=list]:relative
                  group-data-[view-type=list]:size-14
                "
                    onMousedown={handleMouseDown}
                    {...sourceProps}
                  >
                    {slots.thumbnail?.({
                      data: props.data,
                      isFolder: isFolder.value,
                      isVideo: isVideo.value,
                      actressUrl: hasActressCover.value ? actressAsyncState.state.value?.url : undefined,
                      videoCover: hasVideoCover.value ? videoCoverResult?.videoCover.state[0] : undefined,
                      videoCoverLoading: isVideoCoverLoading.value,
                      videoCoverError: videoCoverResult?.videoCover.error,
                      onVideoCoverRetry: videoCoverResult?.retry,
                      hasImagePreview: hasImagePreview.value,
                      onMouseDown: handleMouseDown,
                    }) ?? (
                      <FileItemThumbnail
                        data={props.data}
                        isFolder={isFolder.value}
                        isVideo={isVideo.value}
                        actressUrl={hasActressCover.value ? actressAsyncState.state.value?.url : undefined}
                        videoCover={hasVideoCover.value ? videoCoverResult?.videoCover.state[0] : undefined}
                        videoCoverLoading={isVideoCoverLoading.value}
                        videoCoverError={videoCoverResult?.videoCover.error}
                        onVideoCoverRetry={videoCoverResult?.retry}
                        hasImagePreview={hasImagePreview.value}
                        onMouseDown={handleMouseDown}
                      />
                    )}
                  </span>
                ) }}
              </FileDndSource>

              {/* 内容区域 */}
              <FileItemContent
                data={props.data}
                pathSelect={props.pathSelect}
              />
            </Link>
          </div>
        ) }}
      </FileDndTarget>
    )
  },
})

export default FileItem
