import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { h } from 'vue'
import { Image } from '@/components/Image'
import { I, Icon } from '@/icons'

const meta = {
  title: 'UI/Image',
  parameters: {
    docs: {
      description: {
        component:
          '通用图片加载组件：骨架 → 成功 / 错误回退三态。形状/尺寸/圆角由根容器 class 控制；img 上的响应式 fit / object-position / hover transform 通过 imgClass 传入。默认原生加载，传 referer 走 GMRequest+压缩+缓存（防盗链）。',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Cover: Story = {
  name: 'Cover（方形 / 圆形）',
  render: () => ({
    components: { Image },
    template: `
      <div class="flex items-center gap-4">
        <Image src="https://picsum.photos/300/200" class="h-24 w-32 rounded-lg" fit="cover" />
        <Image src="https://picsum.photos/200" class="h-20 w-20 rounded-full border-2 border-primary" fit="cover" />
      </div>
    `,
  }),
}

export const Contain: Story = {
  name: 'Contain（SVG icon）',
  render: () => ({
    components: { Image },
    template: `
      <div class="flex items-center gap-4">
        <Image
          src="https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/docx.svg"
          class="h-16 w-16 rounded-md bg-base-200"
          fit="contain"
        />
      </div>
    `,
  }),
}

export const ImgClass: Story = {
  name: 'imgClass（响应式 fit / 位移）',
  render: () => ({
    components: { Image },
    template: `
      <Image
        src="https://picsum.photos/300/300"
        class="h-28 w-44 rounded-lg"
        fit="cover"
        img-class="object-top transition-transform duration-300 hover:scale-110"
      />
    `,
  }),
}

export const Lazy: Story = {
  name: '懒加载（滚动按需）',
  render: () => ({
    components: { Image },
    template: `
      <div class="max-h-72 space-y-3 overflow-y-auto">
        <Image
          v-for="i in 8"
          :key="i"
          :src="\`https://picsum.photos/320/180?random=\${i}\`"
          class="aspect-video w-full rounded-lg"
          fit="cover"
          lazy
        />
      </div>
    `,
  }),
}

export const FallbackIcon: Story = {
  name: '错误回退到 Icon',
  render: () => ({
    components: { Image, Icon },
    setup: () => ({
      fallback: () => h(Icon, { name: I.DOCUMENT, class: 'h-full w-full text-base-content/40' }),
    }),
    template: `
      <Image
        src="https://invalid.example.com/broken.svg"
        class="h-14 w-14 rounded-md bg-base-200"
        fit="contain"
        :fallback="fallback"
      />
    `,
  }),
}

export const FallbackDefault: Story = {
  name: '错误默认占位（LoadingError）',
  render: () => ({
    components: { Image },
    template: `
      <Image src="https://invalid.example.com/broken.png" class="h-24 w-32 rounded-lg" fit="cover" />
    `,
  }),
}

export const EmptySrc: Story = {
  name: '空 src 直接回退',
  render: () => ({
    components: { Image },
    template: `
      <Image src="" class="h-12 w-12 rounded-full" fit="cover" />
    `,
  }),
}
