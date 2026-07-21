import type { Share } from '@115master/drive115'
import type { FunctionalComponent, PropType, SVGAttributes } from 'vue'
import { loadIcons } from '@iconify/vue'
import { defineComponent } from 'vue'
import { I, Icon } from '@/icons'
import FolderSvg from '@/icons/custom/folder.svg?component'
import ImageFileSvg from '@/icons/custom/image-file.svg?component'
import { dragIcon } from './dragIcon'

// 预热：setDragImage 同步截图，ion 图标数据须先于首次拖拽就绪
loadIcons([I.FILE_VIDEO, I.AUDIO_TRACK, I.DOCUMENT])

/** custom:* 在 icon.vue 内经 defineAsyncComponent 加载，赶不上 setDragImage 同步截图；静态导入直接渲染 */
const CUSTOM: Record<string, FunctionalComponent<SVGAttributes>> = {
  [I.FILE_FOLDER]: FolderSvg,
  [I.FILE_IMAGE]: ImageFileSvg,
}

/**
 * 拖拽跟随图（堆叠卡片 + 数量角标）
 * 由 useFileList 通过 render() 挂载到屏外容器，供 dataTransfer.setDragImage 使用
 */
const DragImage = defineComponent({
  name: 'DragImage',
  props: {
    items: {
      type: Array as PropType<Share.Entity.FilesItem[]>,
      required: true,
    },
  },
  setup: (props) => {
    return () => {
      const count = props.items.length
      const name = dragIcon(props.items[0])
      const Custom = CUSTOM[name]
      return (
        <div class="relative size-16 select-none">
          {count > 2 && (
            <div class="border-base-content/10 bg-base-100/70 absolute size-14 translate-x-2 translate-y-2 rounded-xl border shadow-sm" />
          )}
          {count > 1 && (
            <div class="border-base-content/10 bg-base-100/90 absolute size-14 translate-x-1 translate-y-1 rounded-xl border shadow" />
          )}
          <div class="border-base-content/10 bg-base-100 absolute flex size-14 items-center justify-center rounded-xl border shadow-lg">
            {Custom
              ? <Custom class="size-8" />
              : <Icon name={name} size="custom" class="text-primary size-8" />}
          </div>
          {count > 1 && (
            <span class="bg-primary text-primary-content absolute -top-1 right-0 flex size-5 items-center justify-center rounded-full text-xs font-semibold shadow">
              {count}
            </span>
          )}
        </div>
      )
    }
  },
})

export default DragImage
