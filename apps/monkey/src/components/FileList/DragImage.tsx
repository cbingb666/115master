import type { Share } from '@115master/drive115'
import type { FunctionalComponent, PropType, SVGAttributes } from 'vue'
import { loadIcons } from '@iconify/vue'
import { defineComponent, h, render } from 'vue'
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
        // 边框仅深色主题保留：浅色下 1px 半透明边框会被感知为「直角矩形框」；
        // 根容器留出 p-2 内边距，让卡片阴影在捕获边界内自然衰减（避免阴影被截出直角边）
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

export default DragImage

/** 挂载拖拽跟随图到屏外容器（setDragImage 要求元素在文档中） */
export function mountDragImage(items: Share.Entity.FilesItem[]) {
  const container = document.createElement('div')
  // 主题变量只挂在 [data-theme] 选择器上（非 :root），容器是 #my-app 的兄弟节点，须自行带上主题
  container.setAttribute('data-theme', document.getElementById('my-app')?.getAttribute('data-theme') || 'dark')
  container.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:9999'
  render(h(DragImage, { items }), container)
  document.body.appendChild(container)
  return {
    el: container.firstElementChild as HTMLElement,
    dispose: () => {
      render(null, container)
      container.remove()
    },
  }
}
