import type { EmptyProps, EmptySize } from '@115master/ui'
import { Button, Empty } from '@115master/ui'
import preview from '../../../.storybook/preview'

const sizes = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const satisfies readonly EmptySize[]

const image = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="22" fill="%235b8def"/%3E%3Cpath d="M27 37h46v31H27z" fill="none" stroke="white" stroke-width="7"/%3E%3Cpath d="M37 37v-8h26v8" fill="none" stroke="white" stroke-width="7"/%3E%3C/svg%3E'

const meta = preview.meta({
  title: 'UI/Empty',
  component: Empty,
  args: {
    description: 'No items to display.',
    image: '',
    size: 'md',
    showImage: true,
  } satisfies EmptyProps,
  argTypes: {
    size: { control: 'inline-radio', options: sizes },
  },
  render: args => ({
    components: { Empty },
    setup: () => ({ args }),
    template: '<div class="p-6"><Empty v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Empty 是居中的空状态占位，适合在内容集合没有可展示项目时提供说明与可选操作。调用方拥有文案、操作和自定义图标；装饰图像不承载独立信息。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Sizes = meta.story({
  name: '尺寸',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Empty },
    setup: () => ({ sizes }),
    template: `
      <div class="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <Empty
          v-for="size in sizes"
          :key="size"
          :size="size"
          :description="size"
        />
      </div>
    `,
  }),
})

export const Content = meta.story({
  name: '内容',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Empty },
    setup: () => ({ image }),
    template: `
      <div class="grid gap-6 p-6 sm:grid-cols-2">
        <Empty description="No matching records.">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" stroke-linecap="round" />
            </svg>
          </template>
          <Button size="sm">Clear filters</Button>
        </Empty>
        <Empty :image="image" description="No uploaded files." />
        <Empty :show-image="false" description="Nothing else to show." />
      </div>
    `,
  }),
})
