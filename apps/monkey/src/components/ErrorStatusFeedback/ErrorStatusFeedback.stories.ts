import type { StatusFeedbackSize } from '@115master/ui'
import type { ErrorStatusFeedbackProps } from './ErrorStatusFeedback'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'
import { ErrorStatusFeedback } from './ErrorStatusFeedback'

const sizes = [
  'xs',
  'sm',
  'md',
  'lg',
] as const satisfies readonly StatusFeedbackSize[]

const meta = preview.meta({
  title: 'App/ErrorStatusFeedback',
  component: ErrorStatusFeedback,
  args: {
    error: 'The request could not be completed.',
    title: 'Request failed',
    iconOnly: false,
    size: 'md',
    padded: true,
    detailLabel: '查看错误详情',
    retryLabel: '重试',
    closeLabel: '关闭',
  } satisfies ErrorStatusFeedbackProps,
  argTypes: {
    size: { control: 'inline-radio', options: sizes },
  },
  render: args => ({
    components: { ErrorStatusFeedback },
    setup: () => ({ args }),
    template: '<ErrorStatusFeedback v-bind="args" />',
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Monkey 应用层错误反馈：组合 StatusFeedback 与应用 Dialog 服务，统一错误详情、关闭和可选重试；不负责发起请求或拥有业务加载状态。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const IconOnly = meta.story({
  name: '仅图标错误入口',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ErrorStatusFeedback },
    setup() {
      const error = new Error('decoder unavailable')
      error.stack = 'Error: decoder unavailable\n    at decode (fixture.ts:1:1)'
      const retries = ref(0)
      const retry = () => retries.value += 1

      return { error, retries, retry }
    },
    template: `
      <section aria-label="Error feedback dialog" class="flex min-h-64 items-center justify-center gap-4 p-6">
        <ErrorStatusFeedback
          :error="error"
          title="视频封面加载失败"
          icon-only
          size="sm"
          :padded="false"
          detail-label="查看视频封面加载错误"
          retry-label="重试加载"
          close-label="关闭"
          :on-retry="retry"
        />
        <output aria-live="polite" data-app-error-status-feedback-result>{{ retries }}</output>
      </section>
    `,
  }),
})

IconOnly.test('shows details and exposes close and retry', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', {
    name: '查看视频封面加载错误: Error: decoder unavailable',
  })
  const retries = canvasElement.querySelector<HTMLOutputElement>(
    '[data-app-error-status-feedback-result]',
  )

  if (!retries)
    throw new Error('ErrorStatusFeedback story did not render its retry outcome')

  trigger.focus()
  await expect(trigger).toHaveFocus()
  await userEvent.keyboard('{Enter}')

  const first = canvas.getByRole('dialog', { name: '视频封面加载失败' })
  await expect(first).toHaveTextContent('decoder unavailable')
  await waitFor(() => expect(within(first).getByText('技术详情')).toBeVisible())
  await userEvent.click(within(first).getByRole('button', { name: '关闭' }))
  await waitFor(() => expect(canvas.queryByRole('dialog', { name: '视频封面加载失败' })).toBeNull())
  await expect(retries).toHaveTextContent('0')

  await userEvent.click(trigger)
  const second = canvas.getByRole('dialog', { name: '视频封面加载失败' })
  await userEvent.click(within(second).getByRole('button', { name: '重试加载' }))
  await waitFor(() => expect(retries).toHaveTextContent('1'))
  await waitFor(() => expect(canvas.queryByRole('dialog', { name: '视频封面加载失败' })).toBeNull())
})
