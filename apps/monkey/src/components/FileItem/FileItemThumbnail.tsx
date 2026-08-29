import type { Share } from '@115master/drive115'
import type { ResponsiveMenuTrigger } from '@115master/ui'
import type { PropType } from 'vue'
import type { IconValue } from '@/icons'
import type { FileIcon, IconUrl } from '@/utils/utils115'
import { Image, ResponsiveMenu } from '@115master/ui'
import { image as imageUtil } from '@115master/utils'
import { computed, defineComponent, shallowRef, watch } from 'vue'
import { I, Icon } from '@/icons'
import { errorFeedback } from '@/utils/errorFeedback'
import { Utils115 } from '@/utils/utils115'

const FileItemThumbnail = defineComponent({
  name: 'FileItemThumbnail',
  props: {
    data: {
      type: Object as PropType<Share.Entity.FilesItem>,
      required: true,
    },
    isFolder: {
      type: Boolean,
      required: true,
    },
    isVideo: {
      type: Boolean,
      required: true,
    },
    actressUrl: {
      type: String,
      default: undefined,
    },
    videoCover: {
      type: Object as PropType<{
        img: string
        width: number
        height: number
      }>,
      default: undefined,
    },
    videoCoverLoading: {
      type: Boolean,
      default: false,
    },
    videoCoverError: {
      type: [Object, String] as PropType<Error | string>,
      default: undefined,
    },
    onVideoCoverRetry: {
      type: Function as PropType<() => void | Promise<unknown>>,
      default: undefined,
    },
    hasImagePreview: {
      type: Boolean,
      required: true,
    },
    onMouseDown: {
      type: Function as PropType<(e: MouseEvent) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const imageReady = shallowRef(false)
    const imageError = shallowRef<unknown>()
    const coverError = computed(() => imageError.value ?? props.videoCoverError)
    const coverLoading = computed(() =>
      props.isVideo
      && !coverError.value
      && (props.videoCoverLoading || (!!props.videoCover && !imageReady.value)),
    )

    watch(() => props.videoCover?.img, () => {
      imageReady.value = false
      imageError.value = undefined
    })

    function isIconUrl(icon: FileIcon): icon is IconUrl {
      return icon.startsWith('https://')
    }

    function renderActressCover() {
      return (
        <Image
          class="
            group-data-[view-type=card]:border-base-content/5
            group-data-[view-type=list]:border-base-content/10
            aspect-square cursor-grab rounded-full
            group-data-[view-type=card]:absolute group-data-[view-type=card]:h-[61%]!
            group-data-[view-type=card]:rounded-full
            group-data-[view-type=card]:border-3 group-data-[view-type=list]:size-13
            group-data-[view-type=list]:border
          "
          imgClass="object-top"
          src={props.actressUrl ?? ''}
          fit="cover"
          draggable={false}
          {...{ onMousedown: props.onMouseDown }}
        />
      )
    }

    function renderVideoCover() {
      return (
        <div
          class={[
            `
              absolute inset-0 m-auto h-full w-full
              cursor-grab overflow-hidden bg-clip-padding
              group-data-[view-type=card]:overflow-hidden group-data-[view-type=card]:rounded-lg
              group-data-[view-type=list]:rounded-md
            `,
            !coverLoading.value && 'border-base-content/5 border bg-black',
          ]}
          aria-busy={coverLoading.value ? 'true' : undefined}
          data-video-cover=""
          onMousedown={props.onMouseDown}
        >
          {props.videoCover && (
            <img
              key={props.videoCover.img}
              class={[
                'block h-full w-full object-cover transition-[opacity,scale] duration-300 ease-[var(--ui-ease-move)] group-data-[view-type=card]:group-hover:scale-105 group-data-[view-type=card]:data-[portrait=true]:object-contain',
                imageReady.value ? 'opacity-100' : 'opacity-0',
              ]}
              src={props.videoCover.img}
              alt={`${props.data.n} 视频封面`}
              draggable={false}
              data-portrait={imageUtil.isPortrait(props.videoCover.width, props.videoCover.height)}
              onLoad={() => imageReady.value = true}
              onError={() => imageError.value = new Error('视频封面图片加载失败')}
            />
          )}
          {coverLoading.value && (
            <div
              aria-hidden="true"
              class="skeleton ui-z-cover absolute inset-0 h-full w-full rounded-[inherit]"
              data-video-cover-skeleton=""
            />
          )}
        </div>
      )
    }

    function showCoverError() {
      const feedback = errorFeedback(coverError.value)
      if (feedback.onDetail) {
        feedback.onDetail()
        return
      }
      alert(feedback.message)
    }

    function retryVideoCover() {
      imageReady.value = false
      imageError.value = undefined
      void props.onVideoCoverRetry?.()
    }

    function renderCoverError() {
      return (
        <ResponsiveMenu title="视频封面加载失败">
          {{
            target: (trigger: ResponsiveMenuTrigger) => (
              <button
                type="button"
                aria-controls={trigger['aria-controls']}
                aria-expanded={trigger['aria-expanded']}
                aria-haspopup={trigger['aria-haspopup']}
                aria-label={trigger['aria-label']}
                class="
                  bg-error text-error-content ui-z-raised focus-visible:outline-error absolute top-1
                  right-1 flex items-center justify-center rounded-full
                  shadow-sm transition-transform ease-[var(--ui-ease-standard)]
                  group-data-[view-type=card]:size-7 group-data-[view-type=list]:size-5 hover:scale-105
                  focus-visible:outline-2 focus-visible:outline-offset-2
                "
                data-video-cover-error-action=""
                onMousedown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  trigger.onClick()
                }}
              >
                <Icon class="size-[70%]" name={I.CLOSE} />
              </button>
            ),
            default: () => (
              <>
                <li>
                  <button type="button" role="menuitem" onClick={showCoverError}>
                    <Icon class="text-lg" name={I.ERROR} />
                    <span>查看错误详情</span>
                  </button>
                </li>
                <li>
                  <button type="button" role="menuitem" onClick={retryVideoCover}>
                    <Icon class="text-lg" name={I.RESTART} />
                    <span>重试加载</span>
                  </button>
                </li>
              </>
            ),
          }}
        </ResponsiveMenu>
      )
    }

    function renderImageCover() {
      return (
        <Image
          class="
            group-data-[view-type=list]:ring-base-content/10 cursor-grab
            group-data-[view-type=card]:relative
            group-data-[view-type=card]:aspect-square group-data-[view-type=card]:h-[70%]
            group-data-[view-type=card]:rounded-md
            group-data-[view-type=card]:transition-all group-data-[view-type=card]:ease-[var(--ui-ease-move)] group-data-[view-type=list]:size-14
            group-data-[view-type=list]:rounded-sm
            group-data-[view-type=list]:ring-1
          "
          imgClass="group-data-[view-type=card]:object-contain"
          src={props.data.u}
          fit="cover"
          lazy
          draggable={false}
          {...{ onMousedown: props.onMouseDown }}
        />
      )
    }

    function renderOfficialIcon(iconUrl: string) {
      return (
        <Image
          class="
            relative cursor-grab
            group-data-[view-type=card]:aspect-square group-data-[view-type=card]:h-[61%] group-data-[view-type=card]:transition-all group-data-[view-type=card]:ease-[var(--ui-ease-move)]
            group-data-[view-type=list]:size-14
          "
          src={iconUrl}
          fit="contain"
          fallback={<Icon name={I.DOCUMENT} class="text-base-content/40 h-full w-full" />}
          draggable={false}
          {...{ onMousedown: props.onMouseDown }}
        />
      )
    }

    function renderFolderCover(icon: IconValue) {
      return (
        <div
          class="
            relative cursor-grab
            group-data-[view-type=card]:h-[61%]
            group-data-[view-type=list]:size-14
          "
          onMousedown={props.onMouseDown}
        >
          <Icon
            class="text-primary/80 h-full w-auto drop-shadow-md"
            name={icon}
          />
        </div>
      )
    }

    function renderFileIcon(icon: IconValue) {
      return (
        <div
          class="
            relative cursor-grab object-contain
            group-data-[view-type=card]:h-[61%] group-data-[view-type=card]:transition-all group-data-[view-type=card]:ease-[var(--ui-ease-move)]
            group-data-[view-type=list]:size-14
          "
          onMousedown={props.onMouseDown}
        >
          <Icon
            class="h-full w-full"
            name={icon}
          />
        </div>
      )
    }

    function renderFallback() {
      const icon = Utils115.getFileIcon(props.data)

      if (isIconUrl(icon))
        return renderOfficialIcon(icon)
      if (props.isFolder)
        return renderFolderCover(icon)
      return renderFileIcon(icon)
    }

    return () => {
      // 女演员封面
      if (props.actressUrl) {
        return renderActressCover()
      }

      // 视频封面加载失败后回退文件图标，并保留错误操作入口
      if (props.isVideo && coverError.value) {
        return (
          <>
            {renderFallback()}
            {renderCoverError()}
          </>
        )
      }

      // 视频封面加载与内容
      if (props.isVideo && (coverLoading.value || props.videoCover)) {
        return renderVideoCover()
      }

      // 图片预览
      if (props.hasImagePreview) {
        return renderImageCover()
      }

      return renderFallback()
    }
  },
})

export default FileItemThumbnail
