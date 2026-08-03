import { Button, Progress } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/Progress',
  component: Progress,
  args: {
    active: true,
  },
  render: args => ({
    components: { Progress },
    setup: () => ({ args }),
    template: `
      <section class="min-h-28 bg-base-100 p-6" aria-label="Progress preview">
        <Progress v-bind="args" />
        <p class="text-sm text-base-content/70">Content stays in place below the viewport indicator.</p>
      </section>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Progress 是固定在视口顶缘的 indeterminate 加载反馈；适合页面级异步流程。它不占据布局，也不替调用方声明内容区域的 busy 状态。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '进行中',
})

export const Inactive = meta.story({
  name: '已结束',
  args: {
    active: false,
  },
})

export const Toggle = meta.story({
  name: '完成与重启',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Progress },
    setup() {
      const active = ref(true)
      return { active }
    },
    template: `
      <section aria-label="Progress lifecycle" class="flex min-h-28 items-center gap-3 bg-base-100 p-6">
        <Progress :active="active" />
        <Button color="primary" @click="active = !active">
          {{ active ? 'Finish progress' : 'Start progress' }}
        </Button>
        <span class="text-sm text-base-content/70">
          State:
          <output aria-live="polite" data-ui-progress-state>{{ active ? 'active' : 'inactive' }}</output>
        </span>
      </section>
    `,
  }),
})

Toggle.test('finishes and restarts the visual loading indicator', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const state = canvasElement.querySelector<HTMLOutputElement>('[data-ui-progress-state]')
  const progress = () => canvasElement.querySelector<HTMLElement>('[data-ui-progress]')

  if (!state)
    throw new Error('Progress lifecycle story did not render its observable state')

  await expect(progress()).toBeInTheDocument()
  await expect(progress()).toHaveAttribute('aria-hidden', 'true')

  await userEvent.click(canvas.getByRole('button', { name: 'Finish progress' }))
  await expect(state).toHaveTextContent('inactive')
  await waitFor(async () => {
    await expect(progress()).not.toBeInTheDocument()
  })

  await userEvent.click(canvas.getByRole('button', { name: 'Start progress' }))
  await expect(state).toHaveTextContent('active')
  await expect(progress()).toBeInTheDocument()
})
