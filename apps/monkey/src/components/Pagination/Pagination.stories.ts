import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Pagination from './Pagination'

function noop() {}

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  args: {
    currentPage: 1,
    currentPageSize: 30,
    total: 100,
    onCurrentPageChange: noop,
    onPageSizeChange: noop,
  },
  parameters: {
    docs: {
      description: {
        component:
          '分页器：响应式双布局（桌面端完整页码 + 尺寸选择器 / 移动端简洁跳转输入），省略号折叠、页码跳转、pageSize 切换。纯展示组件——页码变更与 pageSize 变更通过 props 回调通知父级。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPage: Story = {
  name: '首页（少页）',
  args: { currentPage: 1, total: 90 },
}

export const MiddlePage: Story = {
  name: '中间页（省略号）',
  args: { currentPage: 5, total: 300 },
}

export const LastPage: Story = {
  name: '末页（省略号）',
  args: { currentPage: 28, total: 300 },
}

export const SinglePage: Story = {
  name: '单页',
  args: { currentPage: 1, total: 20 },
}

export const ManyPages: Story = {
  name: '大量页码',
  args: { currentPage: 50, total: 5000 },
}

export const NoSizeChanger: Story = {
  name: '隐藏尺寸选择器',
  args: { currentPage: 3, total: 150, showSizeChanger: false },
}

export const CustomPageSize: Story = {
  name: '自定义 pageSize 选项',
  args: {
    currentPage: 2,
    currentPageSize: 50,
    total: 200,
    pageSizeOptions: [20, 50, 100, 200],
  },
}
