import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Image from './Image'

const meta = {
  title: 'UI/Image',
  component: Image,
  args: { src: '', alt: '示例图片' },
  parameters: {
    docs: {
      description: {
        component:
          '智能图片加载组件：通过 GMRequest 代理加载（带 Referer、缓存、压缩），加载中显示 skeleton 占位，加载失败显示 LoadingError fallback。面向 115 网盘缩略图场景。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Image>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  name: '加载中（skeleton）',
  args: { src: '' },
  render: () => ({
    components: { Image },
    template: `
      <div class="size-48">
        <Image src="" alt="加载中" />
      </div>
    `,
  }),
}

export const Error: Story = {
  name: '加载失败',
  parameters: {
    docs: {
      description: {
        story: '传入无效 src，Image 组件尝试通过 GMRequest 加载失败后显示 LoadingError fallback。',
      },
    },
  },
  render: () => ({
    components: { Image },
    template: `
      <div class="size-48">
        <Image src="https://invalid.example.com/not-found.jpg" alt="加载失败" />
      </div>
    `,
  }),
}

export const SkeletonMode: Story = {
  name: 'Skeleton 模式',
  args: { src: '' },
  render: () => ({
    components: { Image },
    template: `
      <div class="flex gap-4">
        <div class="size-32">
          <Image src="" alt="浅色骨架" skeleton-mode="light" />
        </div>
        <div class="size-32 rounded-xl bg-base-300 p-2">
          <Image src="" alt="深色骨架" skeleton-mode="dark" />
        </div>
      </div>
    `,
  }),
}
