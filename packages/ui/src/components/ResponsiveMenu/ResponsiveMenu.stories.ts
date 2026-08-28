import type { ResponsiveMenuProps } from '@115master/ui'
import { Button, OverlayHost, ResponsiveMenu } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/ResponsiveMenu',
  component: ResponsiveMenu,
  args: {
    title: 'Available actions',
  },
  argTypes: {
    title: { control: 'text' },
  },
  render: (args: ResponsiveMenuProps) => ({
    components: { Button, OverlayHost, ResponsiveMenu },
    setup() {
      const result = ref('idle')

      return { args, result }
    },
    template: `
      <OverlayHost>
        <main aria-label="Responsive Menu behavior" class="flex min-h-80 flex-col items-center justify-center gap-3 p-8">
          <ResponsiveMenu :title="args.title">
            <template #target="trigger">
              <Button v-bind="trigger">Open actions</Button>
            </template>
            <template #default>
              <li role="none">
                <button type="button" role="menuitem" @click="result = 'renamed'">Rename</button>
              </li>
              <li role="none">
                <button type="button" role="menuitem" @click="result = 'copied'">Copy</button>
              </li>
            </template>
          </ResponsiveMenu>
          <output aria-live="polite" data-ui-responsive-menu-result>{{ result }}</output>
        </main>
      </OverlayHost>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          '由锚点触发的响应式操作菜单；桌面使用当前 Theme 的 Overlay Host，紧凑视口使用 Modal Host 下的 bottom Drawer。应用提供标题、触发器和菜单项，不提供挂载节点或 Dialog 服务。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认与响应式行为',
})

Default.test('switches surfaces by viewport and preserves dismissal, focus and selection behavior', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const compact = !window.matchMedia('(min-width: 40rem)').matches
  const trigger = canvas.getByRole('button', { name: 'Available actions' })
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-responsive-menu-result]')

  if (!result)
    throw new Error('Responsive Menu story did not render its observable outcome')

  await expect(trigger).toHaveAttribute('aria-haspopup', compact ? 'dialog' : 'menu')
  trigger.focus()
  await userEvent.click(trigger)

  let menu = await canvas.findByRole('menu', { name: 'Available actions' })
  let rename = canvas.getByRole('menuitem', { name: 'Rename' })

  if (compact) {
    const drawer = canvas.getByRole('dialog', { name: 'Available actions' })

    await expect(drawer).toHaveAttribute('data-ui-responsive-menu', 'drawer')
    await expect(drawer).toHaveAttribute('data-ui-drawer-placement', 'bottom')
    await waitFor(async () => {
      await expect(rename).toHaveFocus()
    })
  }
  else {
    await expect(menu).toHaveAttribute('data-ui-responsive-menu', 'dropdown')
    await expect(menu.closest('[data-ui-overlay-host]')).not.toBeNull()
    await waitFor(async () => {
      await expect(menu).toHaveFocus()
    })
    await userEvent.keyboard('{ArrowDown}')
    await expect(rename).toHaveFocus()
  }

  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu', { name: 'Available actions' })).not.toBeInTheDocument()
  })
  await expect(trigger).toHaveFocus()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await userEvent.click(trigger)
  menu = await canvas.findByRole('menu', { name: 'Available actions' })
  rename = within(menu).getByRole('menuitem', { name: 'Rename' })
  await userEvent.click(rename)
  await expect(result).toHaveTextContent('renamed')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu', { name: 'Available actions' })).not.toBeInTheDocument()
  })
  await expect(trigger).toHaveFocus()
})

Default.test('opens the desktop menu at its anchor without interpolating placement', async ({ canvasElement }) => {
  if (!window.matchMedia('(min-width: 40rem)').matches)
    return

  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Available actions' })
  const frames: { opacity: number, x: number, y: number }[] = []
  let count = 0
  const settled = new Promise<void>((resolve) => {
    document.addEventListener('click', () => {
      const sample = () => {
        const menu = canvasElement.querySelector<HTMLElement>('[role="menu"][aria-label="Available actions"]')

        if (menu) {
          const rect = menu.getBoundingClientRect()

          frames.push({
            opacity: Number(getComputedStyle(menu).opacity),
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          })
        }
        count += 1
        if (frames.some(frame => frame.opacity >= 0.999) || count >= 40) {
          resolve()
          return
        }
        requestAnimationFrame(sample)
      }

      requestAnimationFrame(sample)
    }, { capture: true, once: true })
  })

  await userEvent.click(trigger)
  await settled

  const visible = frames.filter(frame => frame.opacity > 0.05)
  const x = visible.map(frame => frame.x)
  const y = visible.map(frame => frame.y)

  await expect(visible.length).toBeGreaterThan(1)
  await expect(Math.max(...x) - Math.min(...x)).toBeLessThanOrEqual(1)
  await expect(Math.max(...y) - Math.min(...y)).toBeLessThanOrEqual(1)
})
