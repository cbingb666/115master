import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import type { IconName } from '@/icons'
import { image as imageUtil } from '@115master/utils'
import { defineComponent } from 'vue'
import { Icon } from '@/icons'
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
    hasImagePreview: {
      type: Boolean,
      required: true,
    },
    draggable: {
      type: Boolean,
      default: true,
    },
    onMouseDown: {
      type: Function as PropType<(e: MouseEvent) => void>,
      required: false,
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
            group-data-[view-type=list]:border-base-content/10
            aspect-square
            cursor-grab
            rounded-full object-cover
            object-top
            group-data-[view-type=card]:absolute group-data-[view-type=card]:h-[61%]!
            group-data-[view-type=card]:rounded-full
            group-data-[view-type=card]:border-3 group-data-[view-type=list]:size-13
            group-data-[view-type=list]:border
          "
          draggable={props.draggable}
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
          draggable={props.draggable}
          onMousedown={props.onMouseDown}
        >
          <img
            class="
              h-full w-full object-cover transition-all duration-300
              ease-[cubic-bezier(0.33_0_0.67_1)]
              group-data-[view-type=card]:group-hover:scale-105
              group-data-[view-type=card]:data-[portrait=true]:object-contain
            "
            data-portrait={imageUtil.isPortrait(props.videoCover.width, props.videoCover.height)}
            src={props.videoCover.img}
          />
        </div>
      )
    }

    function renderImageCover() {
      return (
        <img
          class="
            group-data-[view-type=list]:ring-base-content/10 cursor-grab rounded-md
            object-cover group-data-[view-type=card]:relative
            group-data-[view-type=card]:aspect-square group-data-[view-type=card]:h-[70%]
            group-data-[view-type=card]:object-contain
            group-data-[view-type=card]:transition-all group-data-[view-type=list]:size-14
            group-data-[view-type=list]:ring-1
          "
          decoding="async"
          draggable={props.draggable}
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
          draggable={props.draggable}
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
          draggable={props.draggable}
          onMousedown={props.onMouseDown}
        >
          <Icon
            class="text-primary/80 h-full w-full drop-shadow-md"
            name={icon as IconName}
          />
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
          draggable={props.draggable}
          onMousedown={props.onMouseDown}
        >
          <Icon
            class="h-full w-full"
            name={icon as IconName}
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

export default FileItemThumbnail
