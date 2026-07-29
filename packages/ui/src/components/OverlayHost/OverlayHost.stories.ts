import { OverlayHost, Tooltip } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/OverlayHost',
  component: OverlayHost,
  parameters: {
    docs: {
      description: {
        component: '当前 Theme 作用域内的临时浮层宿主；它不依赖任何应用挂载节点。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const ThemeScopedTarget = meta.story({
  name: 'Theme 范围内的目标',
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <div class="flex min-h-80 items-center justify-center p-8">
          <Tooltip content="由最近 Overlay Host 承载">
            <button class="btn" type="button">打开说明</button>
          </Tooltip>
        </div>
      </OverlayHost>
    `,
  }),
})

ThemeScopedTarget.test('proves Theme-scoped target ownership', async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement)
  const host = canvasElement.querySelector<HTMLElement>('[data-ui-overlay-host]')
  if (!host)
    throw new Error('Overlay Host did not render')

  await userEvent.click(canvas.getByRole('button', { name: '打开说明' }))
  const tooltip = canvas.getByRole('tooltip')
  await expect(tooltip.parentElement).toBe(host)
  await expect(host.closest('[data-theme]')).toHaveAttribute('data-theme', globals.theme === 'dark' ? 'dark' : 'light')
})
