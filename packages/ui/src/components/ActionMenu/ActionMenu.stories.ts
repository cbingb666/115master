import type {
  ActionMenuGroup,
  ContextMenuMaterial,
} from '@115master/ui'
import { ActionMenu, OverlayHost } from '@115master/ui'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { h, ref } from 'vue'
import preview from '../../../.storybook/preview'

const materials = [
  'floating',
  'overlay',
] as const satisfies readonly ContextMenuMaterial[]

const meta = preview.meta({
  title: 'UI/ActionMenu',
  component: ActionMenu,
  args: {
    groups: [],
    material: 'floating',
    open: false,
    position: { x: 0, y: 0 },
  },
  argTypes: {
    groups: { control: false },
    material: { control: 'inline-radio', options: materials },
    open: { control: 'boolean' },
    position: { control: 'object' },
    to: { control: false },
  },
  render: args => ({
    components: { ActionMenu, OverlayHost },
    setup() {
      const open = ref(args.open)
      const position = ref(args.position)
      const result = ref('idle')
      const groups: ActionMenuGroup[] = [
        [
          {
            id: 'rename',
            label: 'Rename',
            leading: () => h('svg', {
              'data-ui-action-menu-leading': '',
              'viewBox': '0 0 16 16',
            }, [h('path', { d: 'M3 11.5V13h1.5l7-7-1.5-1.5-7 7Z', fill: 'currentColor' })]),
            onSelect: () => {
              result.value = 'renamed'
            },
          },
          {
            id: 'archive',
            label: 'Archive',
            disabled: true,
            onSelect: () => {
              result.value = 'archived'
            },
          },
        ],
        [
          {
            id: 'hidden',
            label: 'Hidden',
            visible: false,
            onSelect: () => {
              result.value = 'hidden'
            },
          },
        ],
        [
          {
            id: 'delete',
            label: 'Delete',
            hint: '⌫',
            tone: 'destructive',
            onSelect: () => {
              result.value = 'deleted'
            },
          },
        ],
      ]

      function show(event: MouseEvent) {
        position.value = { x: event.clientX, y: event.clientY }
        open.value = true
      }

      function set(value: boolean) {
        open.value = value
      }

      return {
        args,
        groups,
        open,
        position,
        result,
        set,
        show,
      }
    },
    template: `
        <OverlayHost>
          <main aria-label="Action Menu behavior" class="flex min-h-80 flex-col items-center justify-center gap-3 p-8">
            <button
              class="btn"
              type="button"
              aria-haspopup="menu"
              :aria-expanded="open"
              @click="show"
              @contextmenu.prevent="show"
            >
              Open actions
            </button>
            <ActionMenu
              :open="open"
              :position="position"
              :groups="groups"
              :material="args.material"
              :to="args.to"
              aria-label="Available actions"
              @update:open="set"
            />
            <output aria-live="polite" data-ui-action-menu-result>{{ result }}</output>
          </main>
        </OverlayHost>
      `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          '由动作描述驱动的标准上下文菜单；统一负责分组、显隐、禁用态、语义色、尾部提示与选中关闭。业务提供动作和可选前导内容，定位与浮层交互仍由 ContextMenu 承担。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认与动作行为',
  args: {
    groups: [],
  },
})

Default.test('normalizes groups and closes after selection', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open actions' })
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-action-menu-result]')

  if (!result)
    throw new Error('Action Menu story did not render its observable outcome')

  trigger.focus()
  await fireEvent.contextMenu(trigger, { clientX: 80, clientY: 100 })

  const menu = await canvas.findByRole('menu', { name: 'Available actions' })
  const rename = within(menu).getByRole('menuitem', { name: 'Rename' })
  const archive = within(menu).getByRole('menuitem', { name: 'Archive' })
  const remove = within(menu).getByRole('menuitem', { name: 'Delete ⌫' })

  await expect(within(menu).queryByRole('menuitem', { name: 'Hidden' })).not.toBeInTheDocument()
  await expect(archive).toBeDisabled()
  await expect(remove).toHaveAttribute('data-ui-action-menu-tone', 'destructive')
  await expect(menu.querySelectorAll('[data-ui-action-menu-separator]')).toHaveLength(1)
  await expect(menu.querySelector('[data-ui-action-menu-leading]')).not.toBeNull()

  await userEvent.click(rename)
  await expect(result).toHaveTextContent('renamed')
  await waitFor(async () => {
    await expect(canvas.queryByRole('menu', { name: 'Available actions' })).not.toBeInTheDocument()
  })
  await expect(trigger).toHaveFocus()
})
