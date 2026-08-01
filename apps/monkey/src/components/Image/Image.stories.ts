import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { ImageLoader } from '@/utils/imageLoader'
import { h } from 'vue'
import { I, Icon } from '@/icons'
import Image from './Image'

const picture = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
    <defs><linearGradient id="g"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
    <rect width="320" height="200" fill="url(#g)"/>
    <circle cx="250" cy="50" r="28" fill="#fff" opacity=".8"/>
    <path d="M0 175l85-75 55 45 45-35 135 90H0z" fill="#fff" opacity=".75"/>
  </svg>
`)}`

const pending: ImageLoader = {
  key: 'storybook-pending',
  load: () => new Promise(() => {}),
}

const broken: ImageLoader = {
  key: 'storybook-error',
  load: async () => { throw new Error('图片加载失败') },
}

const meta = {
  title: 'UI/Image',
  component: Image,
  args: {
    src: picture,
    alt: '示例图片',
  },
  parameters: {
    docs: {
      description: {
        component: '通用图片展示组件：负责骨架、成功与错误状态；特殊图片来源通过 loader seam 注入，不依赖具体请求实现。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Image>

export default meta
type Story = StoryObj<typeof meta>

export const Cover: Story = {
  name: 'Cover（无圆角 / 圆角 / 圆形）',
  render: args => ({
    components: { Image },
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-4">
        <Image v-bind="args" class="h-24 w-32" fit="cover" />
        <Image v-bind="args" class="h-24 w-32 rounded-lg" fit="cover" />
        <Image v-bind="args" class="size-20 rounded-full border-2 border-primary" fit="cover" />
      </div>
    `,
  }),
}

export const Contain: Story = {
  name: 'Contain',
  args: { fit: 'contain' },
  render: args => ({
    components: { Image },
    setup: () => ({ args }),
    template: '<Image v-bind="args" class="size-24 rounded-lg bg-base-200" />',
  }),
}

export const Loading: Story = {
  name: '加载中',
  render: args => ({
    components: { Image },
    setup: () => ({ args, pending }),
    template: '<Image v-bind="args" :loader="pending" class="size-48 rounded-lg" />',
  }),
}

export const LoadError: Story = {
  name: '加载失败',
  render: args => ({
    components: { Image },
    setup: () => ({ args, broken }),
    template: '<Image v-bind="args" :loader="broken" class="h-24 w-32 rounded-lg" />',
  }),
}

export const FallbackIcon: Story = {
  name: '自定义错误回退',
  render: args => ({
    components: { Image, Icon },
    setup: () => ({
      args,
      broken,
      fallback: () => h(Icon, { name: I.DOCUMENT, class: 'h-full w-full text-base-content/40' }),
    }),
    template: `
      <Image
        v-bind="args"
        :loader="broken"
        :fallback="fallback"
        class="size-16 rounded-lg bg-base-200"
        fit="contain"
      />
    `,
  }),
}

export const EmptySrc: Story = {
  name: '空来源',
  args: { src: '' },
  render: args => ({
    components: { Image },
    setup: () => ({ args }),
    template: '<Image v-bind="args" class="size-16 rounded-full" />',
  }),
}
