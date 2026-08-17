import type { ImageFit, ImageLoader, ImageProps } from '@115master/ui'
import { Image } from '@115master/ui'
import { h } from 'vue'
import preview from '../../../.storybook/preview'

const fits = [
  'cover',
  'contain',
] as const satisfies readonly ImageFit[]

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
  load: async () => { throw new Error('Image failed to load') },
}

function fallback() {
  return h(
    'svg',
    {
      'aria-hidden': 'true',
      'class': 'size-full text-base-content/40',
      'fill': 'none',
      'viewBox': '0 0 24 24',
      'stroke': 'currentColor',
      'stroke-width': '1.5',
    },
    [
      h('path', {
        'd': 'M4 3.75h16v16.5H4zM4 16l4.5-4.5 3.25 3.25 2.25-2.25 6 6',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
      h('circle', { cx: '15.5', cy: '8.5', r: '1.5' }),
    ],
  )
}

const meta = preview.meta({
  title: 'UI/Image',
  component: Image,
  args: {
    src: picture,
    alt: 'Abstract landscape',
    fit: 'cover',
    imgClass: '',
    lazy: false,
    draggable: true,
  } satisfies ImageProps,
  argTypes: {
    fit: { control: 'inline-radio', options: fits },
  },
  render: args => ({
    components: { Image },
    setup: () => ({ args }),
    template: `
      <div class="p-6">
        <Image v-bind="args" class="h-24 w-32 rounded-lg" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Image 管理图片的加载、成功和错误状态，并允许注入异步 loader。调用方负责尺寸、替代文本、应用来源适配与自定义回退；组件不拥有请求、缓存或图片业务策略。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Cover = meta.story({
  name: 'Cover（无圆角 / 圆角 / 圆形）',
  render: args => ({
    components: { Image },
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-4 p-6">
        <Image v-bind="args" class="h-24 w-32" fit="cover" />
        <Image v-bind="args" class="h-24 w-32 rounded-lg" fit="cover" />
        <Image v-bind="args" class="size-20 rounded-full border-2 border-primary" fit="cover" />
      </div>
    `,
  }),
})

export const Contain = meta.story({
  name: 'Contain',
  args: { fit: 'contain' },
  render: args => ({
    components: { Image },
    setup: () => ({ args }),
    template: `
      <div class="p-6">
        <Image v-bind="args" class="size-24 rounded-lg bg-base-200" />
      </div>
    `,
  }),
})

export const Loading = meta.story({
  name: '加载中',
  render: args => ({
    components: { Image },
    setup: () => ({ args, pending }),
    template: `
      <div class="p-6">
        <Image v-bind="args" :loader="pending" class="size-48 rounded-lg" />
      </div>
    `,
  }),
})

export const LoadError = meta.story({
  name: '加载失败',
  render: args => ({
    components: { Image },
    setup: () => ({ args, broken }),
    template: `
      <div class="p-6">
        <Image v-bind="args" :loader="broken" class="h-24 w-32 rounded-lg" />
      </div>
    `,
  }),
})

export const FallbackIcon = meta.story({
  name: '自定义错误回退',
  render: args => ({
    components: { Image },
    setup: () => ({ args, broken, fallback }),
    template: `
      <div class="p-6">
        <Image
          v-bind="args"
          :loader="broken"
          :fallback="fallback"
          class="size-16 rounded-lg bg-base-200"
          fit="contain"
        />
      </div>
    `,
  }),
})

export const EmptySrc = meta.story({
  name: '空来源',
  args: { src: '' },
  render: args => ({
    components: { Image },
    setup: () => ({ args }),
    template: `
      <div class="p-6">
        <Image v-bind="args" class="size-16 rounded-full" />
      </div>
    `,
  }),
})
