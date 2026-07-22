import type { Share } from '@115master/drive115'
import type { FunctionalComponent, PropType, SVGAttributes } from 'vue'
import { loadIcons } from '@iconify/vue'
import { defineComponent } from 'vue'
import { I, Icon } from '@/icons'
import FolderSvg from '@/icons/custom/folder.svg?component'
import ImageFileSvg from '@/icons/custom/image-file.svg?component'
import { resolveFileDragIcon } from './resolveFileDragIcon'

// 预热异步图标数据，确保首次跟随层渲染时图标已经就绪。
loadIcons([I.FILE_VIDEO, I.AUDIO_TRACK, I.DOCUMENT])

/** 自定义图标在 Icon 内异步加载；跟随层首帧改用静态组件，避免短暂空白。 */
const CUSTOM: Record<string, FunctionalComponent<SVGAttributes>> = {
  [I.FILE_FOLDER]: FolderSvg,
  [I.FILE_IMAGE]: ImageFileSvg,
}

/** 文件拖拽跟随预览：按数量渲染堆叠卡片和数量角标。 */
const FileDragPreview = defineComponent({
  name: 'FileDragPreview',
  props: {
    items: {
      type: Array as PropType<Share.Entity.FilesItem[]>,
      required: true,
    },
  },
  setup: (props) => {
    return () => {
      const count = props.items.length
      const name = resolveFileDragIcon(props.items[0])
      const Custom = CUSTOM[name]
      return (
        // 浅色主题仅用阴影塑形；根容器留出余量，避免阴影在捕获边缘截成直角。
        <div class="relative size-20 p-2 select-none">
          {count > 2 && (
            <div class="bg-base-100/70 [data-theme='dark']_&:border [data-theme='dark']_&:border-base-content/15 absolute size-14 translate-x-2.5 translate-y-2.5 rounded-xl shadow-sm" />
          )}
          {count > 1 && (
            <div class="bg-base-100/90 [data-theme='dark']_&:border [data-theme='dark']_&:border-base-content/15 absolute size-14 translate-x-[5px] translate-y-[5px] rounded-xl shadow-sm" />
          )}
          <div class="bg-base-100 [data-theme='dark']_&:border [data-theme='dark']_&:border-base-content/15 absolute flex size-14 items-center justify-center rounded-xl shadow-md">
            {Custom
              ? <Custom class="size-8" />
              : <Icon name={name} size="custom" class="text-primary size-8" />}
          </div>
          {count > 1 && (
            <span class="bg-primary text-primary-content absolute top-0 right-0 flex size-5 items-center justify-center rounded-full text-xs font-semibold">
              {count}
            </span>
          )}
        </div>
      )
    }
  },
})

export default FileDragPreview
