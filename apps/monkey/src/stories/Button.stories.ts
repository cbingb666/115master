import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { I, Icon } from '@/icons'

const variants = [
  { class: 'btn-primary', label: 'Primary' },
  { class: 'btn-secondary', label: 'Secondary' },
  { class: 'btn-accent', label: 'Accent' },
  { class: 'btn-neutral', label: 'Neutral' },
  { class: 'btn-info', label: 'Info' },
  { class: 'btn-success', label: 'Success' },
  { class: 'btn-warning', label: 'Warning' },
  { class: 'btn-error', label: 'Error' },
]

const styles = [
  { class: '', label: '默认（玻璃）' },
  { class: 'btn-glass', label: 'Glass' },
  { class: 'btn-ghost', label: 'Ghost' },
  { class: 'btn-soft', label: 'Soft' },
  { class: 'btn-outline', label: 'Outline' },
  { class: 'btn-dash', label: 'Dash' },
  { class: 'btn-link', label: 'Link' },
]

const meta = {
  title: 'UI/Button',
  parameters: {
    docs: {
      description: {
        component:
          'daisyUI `.btn` 的覆写效果（`src/styles/ui-extend.css`）：胶囊外形；普通按钮为半透明玻璃材质；彩色按钮为实色底 + 顶部高光 + 同色系软阴影。',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Colors: Story = {
  name: '颜色',
  render: () => ({
    setup: () => ({ variants }),
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="btn">Default</button>
        <button v-for="v in variants" :key="v.class" type="button" class="btn" :class="v.class">
          {{ v.label }}
        </button>
      </div>
    `,
  }),
}

export const Styles: Story = {
  name: '样式',
  render: () => ({
    setup: () => ({ styles }),
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button v-for="s in styles" :key="s.class" type="button" class="btn" :class="s.class">
          {{ s.label }}
        </button>
      </div>
    `,
  }),
}

export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    components: { Icon },
    setup: () => ({ I }),
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-xs">XS</button>
          <button type="button" class="btn btn-sm">SM</button>
          <button type="button" class="btn">MD</button>
          <button type="button" class="btn btn-lg">LG</button>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-circle btn-xs"><Icon :name="I.PLAY" size="xs" /></button>
          <button type="button" class="btn btn-circle btn-sm"><Icon :name="I.PLAY" size="sm" /></button>
          <button type="button" class="btn btn-circle"><Icon :name="I.PLAY" /></button>
          <button type="button" class="btn btn-circle btn-lg"><Icon :name="I.PLAY" size="lg" /></button>
          <button type="button" class="btn btn-square"><Icon :name="I.CLOSE" /></button>
        </div>
      </div>
    `,
  }),
}

export const States: Story = {
  name: '状态',
  render: () => ({
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn">正常</button>
          <button type="button" class="btn btn-active">Active</button>
          <button type="button" class="btn" disabled>禁用</button>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-primary">正常</button>
          <button type="button" class="btn btn-primary btn-active">Active</button>
          <button type="button" class="btn btn-primary" disabled>禁用</button>
        </div>
        <p class="text-sm opacity-60">悬停态请直接移动鼠标到按钮上查看</p>
      </div>
    `,
  }),
}

export const OnPanel: Story = {
  name: '浮层场景',
  render: () => ({
    template: `
      <div class="app-box-glass max-w-xl rounded-3xl p-6">
        <p class="mb-4">确认要执行该操作吗？</p>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <button type="button" class="btn btn-ghost">取消</button>
          <button type="button" class="btn btn-error">删除</button>
          <button type="button" class="btn btn-primary">确认</button>
        </div>
      </div>
    `,
  }),
}
