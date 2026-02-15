import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import { isPortraitImage } from '@/utils/image'
import { Utils115 } from '@/utils/utils115'

const FileListItemThumbnail = defineComponent({
  name: 'FileListItemThumbnail',
  props: {
    data: {
      type: Object as PropType<WebApi.Entity.FilesItem>,
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
    emoji: {
      type: String,
      default: undefined,
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
    hasImagePreview: {
      type: Boolean,
      required: true,
    },
    onMouseDown: {
      type: Function as PropType<(e: MouseEvent) => void>,
      required: true,
    },
  },
  setup(props) {
    function isIconUrl(icon: string): boolean {
      return icon.startsWith('https://')
    }

    function renderActressCover() {
      return (
        <img
          class="
            group-data-[view-type=card]:border-base-content/5
            aspect-square
            cursor-grab
            rounded-lg
            object-cover object-top
            group-data-[view-type=card]:absolute
            group-data-[view-type=card]:h-[61%]! group-data-[view-type=card]:rounded-full
            group-data-[view-type=card]:border-3
            group-data-[view-type=card]:shadow-[0_0_12px_var(--color-black)_inset]
            group-data-[view-type=list]:size-13 group-data-[view-type=list]:border
            group-data-[view-type=list]:border-neutral-800
          "
          draggable="true"
          src={props.actressUrl}
          onMousedown={props.onMouseDown}
        />
      )
    }

    function renderVideoCover() {
      if (!props.videoCover)
        return null

      return (
        <div
          class="
            border-base-content/5 absolute inset-0 m-auto h-full w-full
            cursor-grab overflow-hidden border bg-black
            group-data-[view-type=card]:overflow-hidden group-data-[view-type=card]:rounded-2xl
            group-data-[view-type=list]:rounded-lg
          "
          draggable="true"
          onMousedown={props.onMouseDown}
        >
          <img
            class="
              h-full w-full object-cover transition-all duration-300
              ease-[cubic-bezier(0.33_0_0.67_1)]
              group-data-[view-type=card]:group-hover:scale-105
              group-data-[view-type=card]:data-[portrait=true]:object-contain
            "
            data-portrait={isPortraitImage(props.videoCover.width, props.videoCover.height)}
            src={props.videoCover.img}
          />
        </div>
      )
    }

    function renderImageCover() {
      return (
        <img
          class="
            cursor-grab rounded-md object-cover
            group-data-[view-type=card]:relative group-data-[view-type=card]:aspect-square
            group-data-[view-type=card]:h-[70%] group-data-[view-type=card]:object-contain
            group-data-[view-type=card]:transition-all
            group-data-[view-type=list]:size-14 group-data-[view-type=list]:ring-1
            group-data-[view-type=list]:ring-neutral-800
          "
          decoding="async"
          draggable="true"
          loading="lazy"
          src={props.data.u}
          onMousedown={props.onMouseDown}
        />
      )
    }

    function renderOfficialIcon(iconUrl: string) {
      return (
        <img
          class="
            relative cursor-grab object-contain
            group-data-[view-type=card]:h-[61%] group-data-[view-type=card]:transition-all
            group-data-[view-type=list]:size-14
          "
          draggable="true"
          src={iconUrl}
          onMousedown={props.onMouseDown}
        />
      )
    }

    function renderFolderCover(icon: string) {
      return (
        <div
          class="
            relative cursor-grab
            group-data-[view-type=card]:h-[61%]
            group-data-[view-type=list]:size-14
          "
          draggable="true"
          onMousedown={props.onMouseDown}
        >
          <Icon
            class="h-full w-full text-blue-300/90 drop-shadow-md drop-shadow-blue-950"
            icon={icon}
          />
          {props.emoji && (
            <span class="
              absolute inset-0 m-auto flex items-center justify-center
              drop-shadow-sm drop-shadow-blue-500
              group-data-[view-type=card]:translate-y-1 group-data-[view-type=card]:text-5xl
              group-data-[view-type=list]:translate-y-0.5 group-data-[view-type=list]:text-2xl
            "
            >
              {props.emoji}
            </span>
          )}
        </div>
      )
    }

    function renderFileIcon(icon: string) {
      return (
        <div
          class="
            relative cursor-grab object-contain
            group-data-[view-type=card]:h-[61%] group-data-[view-type=card]:transition-all
            group-data-[view-type=list]:size-14
          "
          draggable="true"
          onMousedown={props.onMouseDown}
        >
          <Icon
            class="h-full w-full"
            icon={icon}
          />
        </div>
      )
    }

    return () => {
      // 女演员封面
      if (props.actressUrl) {
        return renderActressCover()
      }

      // 视频封面
      if (props.videoCover) {
        return renderVideoCover()
      }

      // 图片预览
      if (props.hasImagePreview) {
        return renderImageCover()
      }

      const icon = Utils115.getFileIcon(props.data)

      // 官方图标
      if (isIconUrl(icon)) {
        return renderOfficialIcon(icon)
      }

      // 文件夹
      if (props.isFolder) {
        return renderFolderCover(icon)
      }

      // 默认文件图标
      return renderFileIcon(icon)
    }
  },
})

export default FileListItemThumbnail
