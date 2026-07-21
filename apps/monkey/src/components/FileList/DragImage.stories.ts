import type { Share } from '@115master/drive115'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DragImage, { mountDragImage } from './DragImage'

function item(partial: Partial<Share.Entity.FilesItem>) {
  return partial as Share.Entity.FilesItem
}

const folder = item({ fc: 0, iv: 0, ico: 'folder' })
const video = item({ fc: 1, iv: 1, ico: 'mp4' })
const doc = item({ fc: 1, iv: 0, ico: 'pdf' })
const audio = item({ fc: 1, iv: 0, ico: 'flac' })
const image = item({ fc: 1, iv: 0, ico: 'jpg' })

const meta = {
  title: 'UI/DragImage',
  component: DragImage,
  parameters: {
    docs: {
      description: {
        component: '拖拽跟随图（堆叠卡片 + 数量角标）。setDragImage 同步截图，所有视觉元素必须同步可渲染；custom SVG 走 ?component 静态导入，ion 图标 loadIcons 预热。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DragImage>

export default meta
type Story = StoryObj<typeof meta>

export const SingleFolder: Story = {
  name: '单个文件夹',
  args: { items: [folder] },
}

export const TwoVideos: Story = {
  name: '两项（两层 + 角标）',
  args: { items: [video, video] },
}

export const FiveMixed: Story = {
  name: '五项（三层堆叠）',
  args: { items: [folder, video, doc, audio, image] },
}

export const DragCapture: Story = {
  name: '真实拖拽捕获',
  args: { items: [video, video] },
  parameters: {
    docs: {
      description: {
        story: '拖动灰块触发真实 HTML5 拖拽，验证 setDragImage 捕获的跟随图与静态渲染一致（截图边界、阴影裁切诊断用）。',
      },
    },
  },
  render: () => ({
    setup: () => {
      function onDragstart(e: DragEvent) {
        if (!e.dataTransfer)
          return
        const drag = mountDragImage([video, video])
        e.dataTransfer.setDragImage(drag.el, 36, 36)
        e.dataTransfer.effectAllowed = 'move'
        setTimeout(drag.dispose, 0)
      }
      return { onDragstart }
    },
    template: `
      <div
        draggable="true"
        class="flex h-24 w-72 cursor-grab items-center justify-center rounded-xl bg-base-content/10 text-sm"
        @dragstart="onDragstart"
      >
        拖动我（跟随图应为：两层堆叠 + 角标 2）
      </div>
    `,
  }),
}
