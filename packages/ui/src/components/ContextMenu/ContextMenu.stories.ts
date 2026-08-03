import type { ContextMenuPosition, ContextMenuProps } from '@115master/ui'
import { ContextMenu, OverlayHost } from '@115master/ui'
import { useArgs } from 'storybook/preview-api'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { reactive, ref } from 'vue'
import preview from '../../../.storybook/preview'

const content = `
  <ul aria-label="常用操作" role="group">
    <li role="none"><button type="button" role="menuitem">编辑</button></li>
    <li role="none"><button type="button" role="menuitem">复制</button></li>
  </ul>
  <hr class="border-base-content/10 mx-2 my-1" role="separator" />
  <ul aria-label="其他操作" role="group">
    <li role="none"><button type="button" role="menuitem">删除</button></li>
  </ul>
`

function useMenu() {
  const open = ref(false)
  const position = ref({ x: 0, y: 0 } satisfies ContextMenuPosition)

  function show(event: MouseEvent) {
    position.value = { x: event.clientX, y: event.clientY }
    open.value = true
  }

  return { open, position, show }
}

async function invoke(trigger: HTMLElement, position?: ContextMenuPosition) {
  const rect = trigger.getBoundingClientRect()

  await fireEvent.contextMenu(trigger, {
    clientX: position?.x ?? rect.left + rect.width / 2,
    clientY: position?.y ?? rect.top + rect.height / 2,
  })
}

const meta = preview.meta({
  title: 'UI/ContextMenu',
  component: ContextMenu,
  args: {
    open: false,
    position: { x: 0, y: 0 },
  },
  argTypes: {
    open: { control: 'boolean' },
    position: { control: 'object' },
    to: { control: false },
  },
  render: (args) => {
    const [, update] = useArgs<ContextMenuProps>()

    return {
      components: { ContextMenu, OverlayHost },
      setup() {
        function show(event: MouseEvent) {
          update({
            open: true,
            position: { x: event.clientX, y: event.clientY },
          })
        }

        return {
          args,
          set: (open: boolean) => update({ open }),
          show,
        }
      },
      template: `
        <OverlayHost>
          <main aria-label="默认 Context Menu" class="flex min-h-80 items-center justify-center p-8">
            <button
              class="btn"
              type="button"
              aria-haspopup="menu"
              :aria-expanded="args.open"
              @click="show"
              @contextmenu.prevent="show"
            >
              打开菜单
            </button>
            <ContextMenu
              v-bind="args"
              aria-label="默认操作"
              @update:open="set"
            >
              ${content}
            </ContextMenu>
          </main>
        </OverlayHost>
      `,
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          '由坐标与受控 open 状态驱动的临时操作表面，用于在指针位置呈现上下文操作。它负责 Overlay Host、视口避让、滚动锁定、焦点循环与关闭语义；应用仍拥有菜单项内容与业务动作。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Positioning = meta.story({
  name: '坐标定位与视口避让',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ContextMenu, OverlayHost },
    setup: useMenu,
    template: `
      <OverlayHost>
        <main aria-label="Context Menu 定位" class="flex min-h-80 items-center justify-center p-8">
          <button
            class="btn"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="open"
            @click="show"
            @contextmenu.prevent="show"
          >
            在坐标处打开
          </button>
          <ContextMenu
            v-model:open="open"
            :position="position"
            aria-label="定位操作"
          >
            ${content}
          </ContextMenu>
        </main>
      </OverlayHost>
    `,
  }),
})

Positioning.test('positions at coordinates and avoids viewport edges', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: '在坐标处打开' })

  await invoke(trigger, { x: 120, y: 80 })
  let menu = await canvas.findByRole('menu', { name: '定位操作' })
  await expect(menu).toHaveStyle({ left: '120px', top: '80px' })
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })

  await invoke(trigger, { x: window.innerWidth - 1, y: window.innerHeight - 1 })
  menu = await canvas.findByRole('menu', { name: '定位操作' })
  await waitFor(async () => {
    const rect = menu.getBoundingClientRect()

    await expect(rect.left).toBeGreaterThanOrEqual(0)
    await expect(rect.top).toBeGreaterThanOrEqual(0)
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth)
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight)
  })
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })
})

export const KeyboardNavigation = meta.story({
  name: '键盘焦点循环',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ContextMenu, OverlayHost },
    setup: useMenu,
    template: `
      <OverlayHost>
        <main aria-label="Context Menu 键盘交互" class="flex min-h-80 items-center justify-center p-8">
          <button
            class="btn"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="open"
            @click="show"
            @contextmenu.prevent="show"
          >
            打开键盘菜单
          </button>
          <ContextMenu
            v-model:open="open"
            :position="position"
            aria-label="键盘操作"
          >
            <ul aria-label="键盘操作项" role="group">
              <li role="none"><button type="button" role="menuitem">第一项</button></li>
              <li role="none"><button type="button" role="menuitem" disabled>不可用项</button></li>
              <li role="none"><button type="button" role="menuitem">最后一项</button></li>
            </ul>
          </ContextMenu>
        </main>
      </OverlayHost>
    `,
  }),
})

KeyboardNavigation.test('cycles keyboard focus and restores the trigger', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: '打开键盘菜单' })

  trigger.focus()
  await invoke(trigger)
  const menu = await canvas.findByRole('menu', { name: '键盘操作' })
  const first = canvas.getByRole('menuitem', { name: '第一项' })
  const disabled = canvas.getByRole('menuitem', { name: '不可用项' })
  const last = canvas.getByRole('menuitem', { name: '最后一项' })
  await waitFor(async () => {
    await expect(menu).toHaveFocus()
  })
  await expect(disabled).toBeDisabled()

  await userEvent.keyboard('{ArrowDown}')
  await expect(first).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await expect(last).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await expect(first).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  await expect(last).toHaveFocus()
  await userEvent.keyboard('{Home}')
  await expect(first).toHaveFocus()
  await userEvent.keyboard('{End}')
  await expect(last).toHaveFocus()
  await userEvent.tab()
  await expect(first).toHaveFocus()
  await userEvent.tab({ shift: true })
  await expect(last).toHaveFocus()

  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })
  await expect(trigger).toHaveFocus()
})

export const Dismissal = meta.story({
  name: '关闭原因与焦点恢复',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ContextMenu, OverlayHost },
    setup() {
      const menu = useMenu()
      const reason = ref('idle')

      return { ...menu, reason }
    },
    template: `
      <OverlayHost>
        <main aria-label="Context Menu 关闭语义" class="flex min-h-80 flex-col items-center justify-center gap-3 p-8">
          <button
            class="btn"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="open"
            @click="show"
            @contextmenu.prevent="show"
          >
            打开待关闭菜单
          </button>
          <span>
            关闭原因：<output aria-live="polite" data-ui-context-menu-reason>{{ reason }}</output>
          </span>
          <ContextMenu
            v-model:open="open"
            :position="position"
            aria-label="待关闭操作"
            @close="reason = $event"
          >
            ${content}
          </ContextMenu>
        </main>
      </OverlayHost>
    `,
  }),
})

Dismissal.test('reports Escape and backdrop dismissal', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: '打开待关闭菜单' })
  const reason = canvasElement.querySelector<HTMLOutputElement>('[data-ui-context-menu-reason]')

  if (!reason)
    throw new Error('Context Menu dismissal story did not render its observable outcome')

  trigger.focus()
  await invoke(trigger)
  await canvas.findByRole('menu', { name: '待关闭操作' })
  const backdrop = canvasElement.querySelector<HTMLElement>('[data-ui-context-menu-backdrop]')

  if (!backdrop)
    throw new Error('Context Menu backdrop did not render')

  await userEvent.click(backdrop)
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })
  await expect(reason).toHaveTextContent('backdrop')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toHaveFocus()

  await invoke(trigger)
  await canvas.findByRole('menu', { name: '待关闭操作' })
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })
  await expect(reason).toHaveTextContent('escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toHaveFocus()
})

export const ScrollLocking = meta.story({
  name: '滚动容器锁定',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ContextMenu, OverlayHost },
    setup: useMenu,
    template: `
      <OverlayHost>
        <main aria-label="Context Menu 滚动锁定" class="flex min-h-80 items-center justify-center p-8">
          <div data-ui-context-menu-scroll class="h-44 w-72 overflow-y-auto border border-base-content/20 p-4">
            <div class="flex h-96 items-start justify-center pt-8">
              <button
                class="btn"
                type="button"
                aria-haspopup="menu"
                :aria-expanded="open"
                @click="show"
                @contextmenu.prevent="show"
              >
                在滚动区打开
              </button>
            </div>
          </div>
          <ContextMenu
            v-model:open="open"
            :position="position"
            aria-label="滚动区操作"
          >
            ${content}
          </ContextMenu>
        </main>
      </OverlayHost>
    `,
  }),
})

ScrollLocking.test('locks and restores the targeted scroll container', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: '在滚动区打开' })
  const scroll = canvasElement.querySelector<HTMLElement>('[data-ui-context-menu-scroll]')

  if (!scroll)
    throw new Error('Context Menu scroll fixture did not render')

  await expect(getComputedStyle(scroll).overflowY).toBe('auto')
  await invoke(trigger)
  await canvas.findByRole('menu', { name: '滚动区操作' })
  await waitFor(async () => {
    await expect(getComputedStyle(scroll).overflowY).toBe('hidden')
  })

  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })
  await expect(getComputedStyle(scroll).overflowY).toBe('auto')
})

export const OverlayTargets = meta.story({
  name: 'Theme Host、显式目标与 body 回退',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ContextMenu, OverlayHost },
    setup() {
      const open = reactive({ body: false, host: false, target: false })
      const position = ref({ x: 0, y: 0 } satisfies ContextMenuPosition)
      const target = ref<HTMLDivElement>()

      function show(key: keyof typeof open, event: MouseEvent) {
        position.value = { x: event.clientX, y: event.clientY }
        open[key] = true
      }

      return { open, position, show, target }
    },
    template: `
      <main aria-label="Context Menu 浮层目标" class="flex min-h-80 items-center justify-center gap-3 p-8">
        <OverlayHost>
          <button
            class="btn"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="open.host"
            @click="show('host', $event)"
            @contextmenu.prevent="show('host', $event)"
          >
            Host 菜单
          </button>
          <button
            class="btn"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="open.target"
            @click="show('target', $event)"
            @contextmenu.prevent="show('target', $event)"
          >
            显式目标菜单
          </button>
          <div ref="target" data-ui-context-menu-target></div>
          <ContextMenu
            v-model:open="open.host"
            :position="position"
            aria-label="Host 操作"
          >
            ${content}
          </ContextMenu>
          <ContextMenu
            v-model:open="open.target"
            :position="position"
            :to="target"
            aria-label="显式目标操作"
          >
            ${content}
          </ContextMenu>
        </OverlayHost>
        <button
          class="btn"
          type="button"
          aria-haspopup="menu"
          :aria-expanded="open.body"
          @click="show('body', $event)"
          @contextmenu.prevent="show('body', $event)"
        >
          body 回退菜单
        </button>
        <ContextMenu
          v-model:open="open.body"
          :position="position"
          aria-label="body 回退操作"
        >
          ${content}
        </ContextMenu>
      </main>
    `,
  }),
})

OverlayTargets.test('resolves explicit, hosted, and fallback targets', async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement)
  const host = canvasElement.querySelector<HTMLElement>('[data-ui-overlay-host]')
  const target = canvasElement.querySelector<HTMLElement>('[data-ui-context-menu-target]')

  if (!host || !target)
    throw new Error('Context Menu overlay fixtures did not render')

  await invoke(canvas.getByRole('button', { name: 'Host 菜单' }))
  let menu = await canvas.findByRole('menu', { name: 'Host 操作' })
  await expect(menu.parentElement).toBe(host)
  await expect(host.closest('[data-theme]')).toHaveAttribute('data-theme', globals.theme === 'dark' ? 'dark' : 'light')
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })

  await invoke(canvas.getByRole('button', { name: '显式目标菜单' }))
  menu = await canvas.findByRole('menu', { name: '显式目标操作' })
  await expect(menu.parentElement).toBe(target)
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument()
  })

  await invoke(canvas.getByRole('button', { name: 'body 回退菜单' }))
  const body = within(document.body)
  menu = await body.findByRole('menu', { name: 'body 回退操作' })
  await expect(menu.parentElement).toBe(document.body)
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(body.queryByRole('menu', { name: 'body 回退操作' })).not.toBeInTheDocument()
  })
})
