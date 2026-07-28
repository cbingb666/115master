import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '@115master/ui'
import { I, Icon } from '@/icons'
import Header from './Header'
import HeaderEnd from './HeaderEnd'
import HeaderStart from './HeaderStart'

const meta = {
  title: 'UI/Header',
  component: Header,
  parameters: {
    docs: {
      description: {
        component:
          '沉浸式 sticky 头部外壳：滚动时羽化衬底渐显，内层为 @container（内容可用 @[480px]: 等容器查询）。布局不固化——配合 HeaderStart（主内容区，可收缩防溢出）/ HeaderEnd（操作区，不收缩）零件组成「左主右副」两段式；需要居中或其他排版时直接在 default slot 自由组合。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const TwoSection: Story = {
  name: '两段式（组合零件）',
  parameters: {
    docs: {
      description: {
        story: '标准用法：HeaderStart 放路径/标题等主内容（超长收缩截断），HeaderEnd 放操作按钮。',
      },
    },
  },
  render: () => ({
    components: { Button, Header, HeaderStart, HeaderEnd, Icon },
    setup: () => ({ I }),
    template: `
      <Header>
        <HeaderStart>
          <span class="truncate text-lg font-medium">根目录 / 视频 / 一段很长很长的文件夹名称用于演示收缩截断</span>
        </HeaderStart>
        <HeaderEnd>
          <Button variant="glass-floating" shape="circle" type="button">
            <Icon :name="I.SEARCH" class="text-xl" />
          </Button>
          <Button variant="glass-floating" shape="circle" type="button">
            <Icon :name="I.NEW_FOLDER" class="text-xl" />
          </Button>
          <Button variant="glass-floating" shape="circle" type="button">
            <Icon :name="I.SORT" class="text-xl" />
          </Button>
        </HeaderEnd>
      </Header>
    `,
  }),
}

export const FreeLayout: Story = {
  name: '自由布局（不用零件）',
  parameters: {
    docs: {
      description: {
        story: 'Header 不固化布局：需要居中（或其他排版）时不使用零件，直接在 default slot 里自由组合。',
      },
    },
  },
  render: () => ({
    components: { Header, Icon },
    setup: () => ({ I }),
    template: `
      <Header>
        <div class="flex flex-1 items-center justify-center gap-2">
          <Icon :name="I.TAG" class="text-xl" />
          <span class="text-lg font-medium">居中标题</span>
        </div>
      </Header>
    `,
  }),
}

export const StickyScroll: Story = {
  name: 'Sticky 滚动羽化',
  parameters: {
    docs: {
      description: {
        story: '向下滚动页面：头部 sticky 吸附顶缘，羽化衬底随滚动渐显（scroll-timeline 驱动），保证悬浮控件在内容之上的可读性。',
      },
    },
  },
  render: () => ({
    components: { Button, Header, HeaderStart, HeaderEnd, Icon },
    setup: () => ({ I }),
    template: `
      <div>
        <Header>
          <HeaderStart>
            <span class="truncate text-lg font-medium">滚动我</span>
          </HeaderStart>
          <HeaderEnd>
            <Button variant="glass-floating" shape="circle" type="button">
              <Icon :name="I.SEARCH" class="text-xl" />
            </Button>
            <Button variant="glass-floating" shape="circle" type="button">
              <Icon :name="I.MORE" class="text-xl" />
            </Button>
          </HeaderEnd>
        </Header>
        <div class="space-y-4 p-4">
          <div v-for="n in 30" :key="n" class="h-24 rounded-2xl bg-base-content/5"></div>
        </div>
      </div>
    `,
  }),
}
