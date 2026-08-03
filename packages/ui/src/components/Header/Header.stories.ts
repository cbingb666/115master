import type { HeaderProps } from '@115master/ui'
import { Button, Header, HeaderEnd, HeaderStart } from '@115master/ui'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/Header',
  component: Header,
  args: {
    class: '',
  } satisfies HeaderProps,
  render: args => ({
    components: { Button, Header, HeaderEnd, HeaderStart },
    setup: () => ({ args }),
    template: `
      <div class="min-h-80 bg-base-200 [--ui-header-gutter:calc(var(--spacing)*6)]">
        <Header v-bind="args">
          <HeaderStart>
            <span class="truncate text-lg font-medium">
              Workspace / Projects / A deliberately long title that demonstrates shrinking
            </span>
          </HeaderStart>
          <HeaderEnd>
            <Button variant="glass-floating" size="sm" type="button">Search</Button>
            <Button variant="glass-floating" size="sm" type="button">Create</Button>
          </HeaderEnd>
        </Header>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Header 是应用无关的吸附式页面头部外壳：随根滚动渐显衬底，并提供容器查询上下文。HeaderStart 承载可收缩的主内容，HeaderEnd 承载不收缩的尾部操作；业务导航、文案和动作由应用提供。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const FreeLayout = meta.story({
  name: '自由布局',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Header },
    template: `
      <div class="min-h-80 bg-base-200 [--ui-header-gutter:calc(var(--spacing)*4)]">
        <Header>
          <div class="flex flex-1 items-center justify-center gap-2">
            <span aria-hidden="true" class="text-xl">◆</span>
            <span class="text-lg font-medium">Centered title</span>
          </div>
        </Header>
      </div>
    `,
  }),
})

export const StickyScroll = meta.story({
  name: '滚动羽化',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Header, HeaderEnd, HeaderStart },
    template: `
      <div class="min-h-[180vh] bg-base-200 [--ui-header-gutter:calc(var(--spacing)*6)]">
        <Header>
          <HeaderStart>
            <span class="truncate text-lg font-medium">Scroll-responsive header</span>
          </HeaderStart>
          <HeaderEnd>
            <Button variant="glass-floating" size="sm" type="button">Search</Button>
            <Button variant="glass-floating" size="sm" type="button">More</Button>
          </HeaderEnd>
        </Header>
        <main aria-label="Sample content" class="grid gap-4 p-6">
          <div v-for="item in 12" :key="item" class="h-24 rounded-box bg-base-content/5" />
        </main>
      </div>
    `,
  }),
})
