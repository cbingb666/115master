import type {
  PaginationLabels,
  PaginationProps,
  PaginationSurface,
} from '@115master/ui'
import { Pagination } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const surfaces = [
  'plain',
  'floating',
] as const satisfies readonly PaginationSurface[]

const labels: PaginationLabels = {
  previousPage: 'Previous page',
  nextPage: 'Next page',
  jumpToPage: 'Jump to page',
  pageSize: 'Items per page',
  pageSizeUnit: 'items',
}

const meta = preview.meta({
  title: 'UI/Pagination',
  component: Pagination,
  args: {
    surface: 'plain',
    embedded: false,
    currentPage: 1,
    currentPageSize: 30,
    total: 90,
    showSizeChanger: true,
    labels,
    onCurrentPageChange: () => {},
    onPageSizeChange: () => {},
  } satisfies PaginationProps,
  argTypes: {
    surface: { control: 'inline-radio', options: surfaces },
  },
  render: args => ({
    components: { Pagination },
    setup: () => ({ args }),
    template: '<div class="flex min-h-48 items-center justify-center bg-base-200 p-6"><Pagination v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Pagination 是受控的响应式页码导航，适合分页数据集。调用方拥有当前页、每页数量、本地化文案与状态变更；模块不请求数据，也不管理业务查询状态。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const ManyPages = meta.story({
  name: '大量页码',
  args: {
    currentPage: 50,
    total: 5000,
  },
})

export const Floating = meta.story({
  name: '浮动表面',
  args: {
    surface: 'floating',
    currentPage: 5,
    total: 300,
  },
})

export const Embedded = meta.story({
  name: '嵌入已有材质',
  args: {
    surface: 'floating',
    embedded: true,
    currentPage: 5,
    total: 300,
  },
  render: args => ({
    components: { Pagination },
    setup: () => ({ args }),
    template: `
      <div class="flex min-h-48 items-center justify-center bg-base-200 p-6">
        <div class="ui-glass-floating rounded-box p-3">
          <Pagination v-bind="args" />
        </div>
      </div>
    `,
  }),
})

export const WithoutSizeChanger = meta.story({
  name: '隐藏每页数量',
  args: {
    currentPage: 3,
    total: 150,
    showSizeChanger: false,
  },
})

export const Behavior = meta.story({
  name: '导航契约',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Pagination },
    setup() {
      const page = ref(5)
      const size = ref(30)
      return { labels, page, size }
    },
    template: `
      <main aria-label="Pagination behavior" class="flex min-h-48 flex-col items-center justify-center gap-4 bg-base-200 p-6">
        <Pagination
          surface="floating"
          :current-page="page"
          :current-page-size="size"
          :total="300"
          :labels="labels"
          :on-current-page-change="value => page = value"
          :on-page-size-change="value => size = value"
        />
        <output data-ui-pagination-result aria-live="polite">{{ page }}/{{ size }}</output>
      </main>
    `,
  }),
})

Behavior.test('changes pages by button and jump input, then changes page size', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-pagination-result]')

  if (!result)
    throw new Error('Pagination behavior story did not render its observable outcome')

  await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
  await expect(result).toHaveTextContent('6/30')

  await userEvent.type(canvas.getByRole('textbox', { name: 'Jump to page' }), '9{Enter}')
  await expect(result).toHaveTextContent('9/30')

  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Items per page' }), '50')
  await expect(result).toHaveTextContent('9/50')
})
