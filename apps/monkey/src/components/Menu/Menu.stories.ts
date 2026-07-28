import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { getCurrentInstance } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import Menu from './Menu'

const routes = [
  { path: '/drive', name: 'drive', component: { template: '<div />' } },
  { path: '/drive/star', name: 'drive-star', component: { template: '<div />' } },
  { path: '/tags', name: 'tags', component: { template: '<div />' } },
]

/** 创建 router 并安装到当前 app，然后导航到指定路径 */
function useRouter(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const app = getCurrentInstance()?.appContext.app
  if (app) {
    app.use(router)
    router.push(path)
  }
}

const meta = {
  title: 'UI/Menu',
  component: Menu,
  parameters: {
    docs: {
      description: {
        component:
          '侧边栏导航菜单：按 `MENU_CONFIG` 渲染导航项（图标 + 文字），通过 `activeMatch`（路由名 + params 匹配）高亮当前项。依赖 vue-router（RouterLink + useRoute）。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '全部（默认高亮）',
  render: () => ({
    components: { Menu },
    setup() {
      useRouter('/drive')
      return {}
    },
    template: `
      <div class="w-52 rounded-2xl bg-base-200 p-2">
        <Menu />
      </div>
    `,
  }),
}

export const StarActive: Story = {
  name: '星标页高亮',
  render: () => ({
    components: { Menu },
    setup() {
      useRouter('/drive/star')
      return {}
    },
    template: `
      <div class="w-52 rounded-2xl bg-base-200 p-2">
        <Menu />
      </div>
    `,
  }),
}

export const TagsActive: Story = {
  name: '标签管理页高亮',
  render: () => ({
    components: { Menu },
    setup() {
      useRouter('/tags')
      return {}
    },
    template: `
      <div class="w-52 rounded-2xl bg-base-200 p-2">
        <Menu />
      </div>
    `,
  }),
}
