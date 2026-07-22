import type { Share } from '@115master/drive115'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { h, ref } from 'vue'
import { DndLayer, useDndSource, useDndTarget } from '@/components/Dnd'
import DragImage from './DragImage'

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
        component: '拖拽跟随图（堆叠卡片 + 数量角标）。由自研 Pointer 拖拽的 DndLayer 渲染——不经过浏览器拖拽图快照，视觉所见即所得。',
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

export const PointerDnd: Story = {
  name: 'Pointer 拖拽（自研）',
  args: { items: [video, video] },
  parameters: {
    docs: {
      description: {
        story: '按住灰块拖到下方投放区，验证 useDndSource/useDndTarget/DndLayer 全链路：跟随图、目标高亮、drop 回调。',
      },
    },
  },
  render: () => ({
    components: { DndLayer },
    setup: () => {
      const { onPointerdown } = useDndSource<Share.Entity.FilesItem[]>({
        payload: () => [video, video],
        ghost: items => h(DragImage, { items }),
        offset: { x: 36, y: 36 },
      })
      const el = ref<HTMLElement>()
      const dropped = ref('')
      const target = useDndTarget<Share.Entity.FilesItem[]>({
        id: 'demo',
        el: () => el.value,
        accept: () => true,
        onDrop: items => dropped.value = `已投放 ${items.length} 项`,
      })
      return { onPointerdown, el, hovering: target.hovering, dropped }
    },
    template: `
      <div class="flex flex-col gap-4">
        <div
          class="flex h-24 w-72 cursor-grab items-center justify-center rounded-xl bg-base-content/10 text-sm select-none"
          @pointerdown="onPointerdown"
        >
          按住拖动我（跟随图：两层堆叠 + 角标 2）
        </div>
        <div
          ref="el"
          class="border-base-content/20 data-[hover=true]:border-primary data-[hover=true]:bg-primary/10 flex h-24 w-72 items-center justify-center rounded-xl border-2 border-dashed text-sm"
          :data-hover="hovering"
        >
          投放区 {{ dropped }}
        </div>
        <DndLayer />
      </div>
    `,
  }),
}
