import type {
  StatusFeedbackProps,
  StatusFeedbackSize,
  StatusFeedbackStatus,
} from '@115master/ui'
import { StatusFeedback } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const statuses = [
  'error',
  'warning',
  'info',
  'success',
] as const satisfies readonly StatusFeedbackStatus[]

const sizes = [
  'xs',
  'sm',
  'md',
  'lg',
] as const satisfies readonly StatusFeedbackSize[]

const meta = preview.meta({
  title: 'UI/StatusFeedback',
  component: StatusFeedback,
  args: {
    status: 'info',
    message: 'Data synchronization is in progress.',
    size: 'md',
    padded: true,
  } satisfies StatusFeedbackProps,
  argTypes: {
    status: { control: 'select', options: statuses },
    size: { control: 'inline-radio', options: sizes },
  },
  render: args => ({
    components: { StatusFeedback },
    setup: () => ({ args }),
    template: '<StatusFeedback v-bind="args" />',
  }),
  parameters: {
    docs: {
      description: {
        component:
          'StatusFeedback 是居中的语义状态反馈，适合在内容区域展示信息、成功、警告或错误消息。调用方提供消息、操作文案与回调，并可通过 slot 注入图标；模块不解释业务错误或管理应用状态。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Statuses = meta.story({
  name: '语义状态',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { StatusFeedback },
    template: `
      <div class="space-y-4">
        <StatusFeedback status="error" message="Network connection failed." />
        <StatusFeedback status="warning" message="Storage space is running low." />
        <StatusFeedback status="info" message="Data synchronization is in progress." />
        <StatusFeedback status="success" message="The operation completed successfully." />
      </div>
    `,
  }),
})

export const Sizes = meta.story({
  name: '尺寸',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { StatusFeedback },
    template: `
      <div class="space-y-4">
        <StatusFeedback size="xs" message="xs" />
        <StatusFeedback size="sm" message="sm" />
        <StatusFeedback size="md" message="md" />
        <StatusFeedback size="lg" message="lg" />
      </div>
    `,
  }),
})

export const Actions = meta.story({
  name: '可选动作',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { StatusFeedback },
    setup: () => ({ action: () => {} }),
    template: `
      <div class="space-y-4">
        <StatusFeedback
          status="error"
          message="The request timed out."
          retry-label="Retry"
          :on-retry="action"
        />
        <StatusFeedback
          message="This notice can be dismissed."
          close-label="Dismiss"
          :on-close="action"
        />
        <StatusFeedback
          status="warning"
          message="Additional diagnostic information is available."
          detail-label="View details"
          :on-detail="action"
        />
      </div>
    `,
  }),
})

export const Behavior = meta.story({
  name: '动作契约',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { StatusFeedback },
    setup() {
      const result = ref('idle')
      const retry = () => result.value = 'retry'
      const close = () => result.value = 'close'
      const detail = () => result.value = 'detail'

      return { result, retry, close, detail }
    },
    template: `
      <section aria-label="Status feedback actions" class="flex min-h-64 items-center justify-center bg-base-100 p-6">
        <StatusFeedback
          status="error"
          message="Request failed"
          retry-label="Retry"
          :on-retry="retry"
          close-label="Close"
          :on-close="close"
          detail-label="View details"
          :on-detail="detail"
        />
        <output aria-live="polite" data-ui-status-feedback-result>{{ result }}</output>
      </section>
    `,
  }),
})

Behavior.test('invokes retry, close and detail actions', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const retry = canvas.getByRole('button', { name: 'Retry' })
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-status-feedback-result]')

  if (!result)
    throw new Error('StatusFeedback behavior story did not render its observable outcome')

  retry.focus()
  await expect(retry).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await expect(result).toHaveTextContent('retry')
  await userEvent.click(canvas.getByRole('button', { name: 'Close' }))
  await expect(result).toHaveTextContent('close')
  await userEvent.click(canvas.getByRole('button', { name: 'View details' }))
  await expect(result).toHaveTextContent('detail')
})

export const CustomIcon = meta.story({
  name: '自定义图标',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { StatusFeedback },
    template: `
      <div class="space-y-4">
        <StatusFeedback status="warning" message="Custom warning icon">
          <template #icon>
            <svg aria-hidden="true" class="size-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m12 4 9 16H3L12 4Z" />
              <path d="M12 9v5M12 17h.01" stroke-linecap="round" />
            </svg>
          </template>
        </StatusFeedback>
        <StatusFeedback status="success" message="Custom success icon">
          <template #icon>
            <svg aria-hidden="true" class="size-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16 9" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </template>
        </StatusFeedback>
      </div>
    `,
  }),
})

export const Unpadded = meta.story({
  name: '无内边距',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { StatusFeedback },
    template: `
      <div class="rounded-xl border border-base-content/20 p-2">
        <StatusFeedback :padded="false" size="xs" message="Compact state without extra padding" />
      </div>
    `,
  }),
})
