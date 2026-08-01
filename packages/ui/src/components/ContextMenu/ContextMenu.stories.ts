import { ContextMenu, OverlayHost } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/ContextMenu',
  component: ContextMenu,
  parameters: {
    docs: {
      description: {
        component:
          '受控上下文菜单原语。坐标定位、视口避让、Theme Host、滚动锁定、焦点循环与关闭语义均由公共契约负责；应用只提供菜单项。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Contract = meta.story({
  name: '定位、焦点与关闭',
  render: () => ({
    components: { ContextMenu, OverlayHost },
    setup() {
      const open = ref(false)
      const position = ref({ x: 0, y: 0 })
      const reason = ref('idle')

      function show(event: MouseEvent) {
        position.value = { x: event.clientX, y: event.clientY }
        open.value = true
      }

      return { open, position, reason, show }
    },
    template: `
      <OverlayHost>
        <div class="flex min-h-80 flex-col items-center justify-center gap-3 p-8">
          <button class="btn" type="button" @contextmenu.prevent="show">
            右键打开菜单
          </button>
          <output data-ui-context-menu-result>{{ reason }}</output>
          <ContextMenu
            v-model:open="open"
            :position="position"
            aria-label="文件操作"
            @close="reason = $event"
          >
            <ul role="group">
              <li role="none"><button type="button" role="menuitem">重命名</button></li>
              <li role="none"><button type="button" role="menuitem">移动</button></li>
            </ul>
            <hr class="border-base-content/10 mx-2 my-1" role="separator" />
            <ul role="group">
              <li role="none"><button type="button" role="menuitem">删除</button></li>
            </ul>
          </ContextMenu>
        </div>
      </OverlayHost>
    `,
  }),
})

Contract.test('proves positioning, focus, host ownership, and dismissal', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: '右键打开菜单' })
  const host = canvasElement.querySelector<HTMLElement>('[data-ui-overlay-host]')
  if (!host)
    throw new Error('Context Menu Overlay Host did not render')

  trigger.focus()
  trigger.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    clientX: 120,
    clientY: 80,
  }))

  const menu = await canvas.findByRole('menu', { name: '文件操作' })
  await expect(menu.parentElement).toBe(host)
  await expect(menu.style.left).toBe('120px')
  await expect(menu.style.top).toBe('80px')
  await waitFor(async () => {
    await expect(menu).toHaveFocus()
  })

  await userEvent.keyboard('{ArrowDown}')
  await expect(canvas.getByRole('menuitem', { name: '重命名' })).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  await expect(canvas.getByRole('menuitem', { name: '删除' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })
  await expect(canvas.getByText('escape')).toBeVisible()
  await expect(trigger).toHaveFocus()

  trigger.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    clientX: 120,
    clientY: 80,
  }))
  await canvas.findByRole('menu')
  const backdrop = canvasElement.querySelector<HTMLElement>('[data-ui-context-menu-backdrop]')
  if (!backdrop)
    throw new Error('Context Menu backdrop did not render')
  await userEvent.click(backdrop)
  await expect(canvas.getByText('backdrop')).toBeVisible()
})
