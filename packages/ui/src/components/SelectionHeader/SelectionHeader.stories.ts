import type { SelectionHeaderProps } from '@115master/ui'
import { SelectionHeader } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/SelectionHeader',
  component: SelectionHeader,
  args: {
    count: 5,
    countLabel: 'items',
    exitLabel: 'Exit selection',
    onExit: () => {},
    allSelected: false,
    selectAllLabel: 'Select all',
    onSelectAll: () => {},
  } satisfies SelectionHeaderProps,
  render: args => ({
    components: { SelectionHeader },
    setup: () => ({ args }),
    template: `
      <div class="min-h-48 bg-base-200">
        <SelectionHeader v-bind="args">
          <template #exit-icon>
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </template>
          <template #select-all-icon>
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m5 12 4 4L19 6" />
              <path d="m5 6 4 4" />
            </svg>
          </template>
        </SelectionHeader>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'SelectionHeader 是选择模式的页面头部：展示选中数量并提供退出操作，可按调用方提供的回调显示全选。全选按钮位于左侧，并由调用方通过 allSelected 控制隐藏；文案由调用方提供，图标通过 named slots 注入；组件不管理选择状态。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const ExitOnly = meta.story({
  name: '仅退出',
  args: {
    selectAllLabel: undefined,
    onSelectAll: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: '不提供全选回调时，只渲染退出操作。',
      },
    },
  },
})

export const AllSelected = meta.story({
  name: '已全选',
  args: {
    allSelected: true,
  },
  parameters: {
    docs: {
      description: {
        story: '调用方标记为已全选时，全选按钮不渲染。',
      },
    },
  },
})

export const Behavior = meta.story({
  name: '动作契约',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { SelectionHeader },
    setup() {
      const result = ref('idle')
      const allSelected = ref(false)
      const exit = () => result.value = 'exit'
      const selectAll = () => {
        result.value = 'select-all'
        allSelected.value = true
      }

      return { result, allSelected, exit, selectAll }
    },
    template: `
      <section aria-label="Selection header actions" class="min-h-48 bg-base-200">
        <SelectionHeader
          :count="5"
          count-label="items"
          exit-label="Exit selection"
          :on-exit="exit"
          :all-selected="allSelected"
          select-all-label="Select all"
          :on-select-all="selectAll"
        >
          <template #exit-icon>
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </template>
          <template #select-all-icon>
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m5 12 4 4L19 6" />
              <path d="m5 6 4 4" />
            </svg>
          </template>
        </SelectionHeader>
        <output aria-live="polite" data-ui-selection-header-result>{{ result }}</output>
      </section>
    `,
  }),
})

Behavior.test('invokes the configured selection actions', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-selection-header-result]')

  if (!result)
    throw new Error('SelectionHeader behavior story did not render its observable outcome')

  await expect(canvas.getByText('5 items')).toBeVisible()
  await userEvent.click(canvas.getByRole('button', { name: 'Select all' }))
  await expect(result).toHaveTextContent('select-all')
  await waitFor(() => expect(canvas.queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument())
  await userEvent.click(canvas.getByRole('button', { name: 'Exit selection' }))
  await expect(result).toHaveTextContent('exit')
})
