import { OverlayHost, Tooltip } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/OverlayHost',
  component: OverlayHost,
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <div class="flex min-h-80 items-center justify-center p-8">
          <Tooltip content="Rendered inside the current Theme">
            <button class="btn" type="button">Show overlay</button>
          </Tooltip>
        </div>
      </OverlayHost>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'OverlayHost 是当前 Theme 作用域内临时浮层的共享宿主；将它放在 Theme 根部，让后代浮层脱离裁切上下文但继续继承主题。它不是可见布局容器，也不依赖应用挂载节点。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

Default.test('hosts an accessible transient overlay inside the current Theme', async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Show overlay' })
  const host = canvasElement.querySelector<HTMLElement>('[data-ui-overlay-host]')

  if (!host)
    throw new Error('Overlay Host did not render')

  await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  await expect(trigger).not.toHaveAttribute('aria-describedby')

  await userEvent.tab()
  await expect(trigger).toHaveFocus()
  const tooltip = canvas.getByRole('tooltip')

  await expect(tooltip).toHaveTextContent('Rendered inside the current Theme')
  await expect(trigger).toHaveAttribute('aria-describedby', tooltip.id)
  await expect(tooltip.parentElement).toBe(host)
  await expect(host.closest('[data-theme]')).toHaveAttribute('data-theme', globals.theme === 'dark' ? 'dark' : 'light')

  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })
  await expect(trigger).not.toHaveAttribute('aria-describedby')
})
