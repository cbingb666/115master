import type {
  ButtonColor,
  ButtonShape,
  ButtonSize,
  ButtonType,
  ButtonVariant,
} from '@115master/ui'
import { Button } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const colors = [
  'default',
  'neutral',
  'primary',
  'secondary',
  'accent',
  'info',
  'success',
  'warning',
  'error',
] as const satisfies readonly ButtonColor[]

const variants = [
  'solid',
  'soft',
  'outline',
  'dash',
  'ghost',
  'link',
] as const satisfies readonly ButtonVariant[]

const glass = [
  'glass-surface',
  'glass-inset',
  'glass-floating',
  'glass-overlay',
] as const satisfies readonly ButtonVariant[]

const sizes = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
] as const satisfies readonly ButtonSize[]

const shapes = [
  'default',
  'square',
  'circle',
] as const satisfies readonly ButtonShape[]

const types = [
  'button',
  'submit',
  'reset',
] as const satisfies readonly ButtonType[]

const meta = preview.meta({
  title: 'UI/Button',
  component: Button,
  args: {
    color: 'default',
    variant: 'solid',
    size: 'md',
    shape: 'default',
    type: 'button',
    active: false,
    block: false,
    loading: false,
    disabled: false,
  },
  argTypes: {
    color: { control: 'select', options: colors },
    variant: { control: 'select', options: [...variants, ...glass] },
    size: { control: 'inline-radio', options: sizes },
    shape: { control: 'inline-radio', options: shapes },
    type: { control: 'inline-radio', options: types },
  },
  render: args => ({
    components: { Button },
    setup: () => ({ args }),
    template: '<div class="p-6"><Button v-bind="args">Action</Button></div>',
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Button 是执行即时动作的原生按钮；用于提交或触发操作。link 与 Glass 只改变外观，导航必须使用链接。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Colors = meta.story({
  name: '颜色',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    setup: () => ({ colors }),
    template: `
      <div aria-label="Button colors" class="flex flex-wrap items-center gap-3 p-6">
        <Button v-for="color in colors" :key="color" :color="color">
          {{ color }}
        </Button>
      </div>
    `,
  }),
})

export const Variants = meta.story({
  name: '变体',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    setup: () => ({ variants }),
    template: `
      <div aria-label="Button variants" class="flex flex-wrap items-center gap-3 p-6">
        <Button
          v-for="variant in variants"
          :key="variant"
          :variant="variant"
        >
          {{ variant }}
        </Button>
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
    components: { Button },
    setup: () => ({ sizes }),
    template: `
      <div aria-label="Button sizes" class="flex flex-wrap items-center gap-3 p-6">
        <Button v-for="size in sizes" :key="size" :size="size">
          {{ size }}
        </Button>
      </div>
    `,
  }),
})

export const Shapes = meta.story({
  name: '形状',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    setup: () => ({ shapes }),
    template: `
      <div aria-label="Button shapes" class="flex flex-wrap items-center gap-3 p-6">
        <Button
          v-for="shape in shapes"
          :key="shape"
          :aria-label="shape + ' shape'"
          :shape="shape"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4" fill="currentColor">
            <path d="M8 1.5 9.7 6.3 14.5 8l-4.8 1.7L8 14.5 6.3 9.7 1.5 8l4.8-1.7L8 1.5Z" />
          </svg>
        </Button>
      </div>
    `,
  }),
})

export const Content = meta.story({
  name: '内容',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    template: `
      <div aria-label="Button content" class="flex flex-wrap items-center gap-3 p-6">
        <Button>Text action</Button>
        <Button>
          <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4" fill="currentColor">
            <path d="M8 1.5 9.7 6.3 14.5 8l-4.8 1.7L8 14.5 6.3 9.7 1.5 8l4.8-1.7L8 1.5Z" />
          </svg>
          <span>Icon and text</span>
        </Button>
        <Button shape="circle" aria-label="Open settings" title="Open settings">
          <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4" fill="currentColor">
            <path d="M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
          </svg>
        </Button>
      </div>
    `,
  }),
})

export const States = meta.story({
  name: '状态',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    template: `
      <div aria-label="Button states" class="flex flex-wrap items-center gap-3 p-6">
        <Button>Enabled</Button>
        <Button active>Active</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </div>
    `,
  }),
})

export const Width = meta.story({
  name: '宽度',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    template: `
      <div aria-label="Button width" class="w-full max-w-sm space-y-3 p-6">
        <div><Button>Available width</Button></div>
        <Button block>Available width</Button>
      </div>
    `,
  }),
})

export const GlassVariants = meta.story({
  name: 'Glass 变体',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    template: `
      <div aria-label="Glass Button contexts" class="grid gap-4 bg-base-200 p-6 sm:grid-cols-2">
        <div class="rounded-box bg-base-100 p-6">
          <Button variant="glass-surface">Surface</Button>
        </div>
        <div class="rounded-box bg-base-300 p-6">
          <Button variant="glass-inset">Inset</Button>
        </div>
        <div
          class="rounded-box p-6"
          style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary) 50%, var(--color-neutral))"
        >
          <Button variant="glass-floating">Floating</Button>
        </div>
        <div class="rounded-box bg-neutral p-6">
          <Button variant="glass-overlay">Overlay</Button>
        </div>
      </div>
    `,
  }),
})

export const Interaction = meta.story({
  name: '动作与可用状态',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    setup() {
      const actions = ref(0)
      const act = () => actions.value += 1

      return { actions, act }
    },
    template: `
      <section aria-label="Button interaction" class="flex flex-wrap items-center gap-3 p-6">
        <Button title="Execute the action" :tabindex="0" @click="act">Execute action</Button>
        <Button disabled @click="act">Disabled action</Button>
        <Button loading @click="act">Loading action</Button>
        <span>
          Actions:
          <output aria-live="polite" data-ui-button-actions>{{ actions }}</output>
        </span>
      </section>
    `,
  }),
})

Interaction.test('supports pointer and keyboard actions and exposes unavailable states', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const actions = canvasElement.querySelector<HTMLOutputElement>('[data-ui-button-actions]')

  if (!actions)
    throw new Error('Button interaction story did not render its observable outcome')

  const action = canvas.getByRole('button', { name: 'Execute action' })
  const disabled = canvas.getByRole('button', { name: 'Disabled action' })
  const loading = canvas.getByRole('button', { name: 'Loading action' })

  await expect(action).toHaveAttribute('type', 'button')
  await expect(action).toHaveAttribute('title', 'Execute the action')
  await expect(action).toHaveAttribute('tabindex', '0')
  await expect(action).toBeEnabled()
  await expect(disabled).toBeDisabled()
  await expect(loading).toBeDisabled()
  await expect(loading).toHaveAttribute('aria-busy', 'true')

  action.focus()
  await expect(action).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await expect(actions).toHaveTextContent('1')

  await userEvent.click(action)
  await expect(actions).toHaveTextContent('2')
})

export const NativeForm = meta.story({
  name: '原生表单行为',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    setup() {
      const actions = ref(0)
      const resets = ref(0)
      const submits = ref(0)
      const act = () => actions.value += 1
      const reset = () => resets.value += 1
      const submit = () => submits.value += 1

      return { actions, resets, submits, act, reset, submit }
    },
    template: `
      <form
        aria-label="Native form behavior"
        class="flex flex-wrap items-center gap-3 p-6"
        @reset.prevent="reset"
        @submit.prevent="submit"
      >
        <Button @click="act">Run without submitting</Button>
        <Button type="submit">Submit form</Button>
        <Button type="reset">Reset form</Button>
        <span>
          Actions:
          <output aria-live="polite" data-ui-button-form-actions>{{ actions }}</output>
        </span>
        <span>
          Submits:
          <output aria-live="polite" data-ui-button-submits>{{ submits }}</output>
        </span>
        <span>
          Resets:
          <output aria-live="polite" data-ui-button-resets>{{ resets }}</output>
        </span>
      </form>
    `,
  }),
})

NativeForm.test('preserves native button submit and reset behavior', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const actions = canvasElement.querySelector<HTMLOutputElement>('[data-ui-button-form-actions]')
  const submits = canvasElement.querySelector<HTMLOutputElement>('[data-ui-button-submits]')
  const resets = canvasElement.querySelector<HTMLOutputElement>('[data-ui-button-resets]')

  if (!actions || !submits || !resets)
    throw new Error('Button form story did not render its observable outcomes')

  const action = canvas.getByRole('button', { name: 'Run without submitting' })
  const submit = canvas.getByRole('button', { name: 'Submit form' })
  const reset = canvas.getByRole('button', { name: 'Reset form' })

  await expect(action).toHaveAttribute('type', 'button')
  await expect(submit).toHaveAttribute('type', 'submit')
  await expect(reset).toHaveAttribute('type', 'reset')

  await userEvent.click(action)
  await expect(actions).toHaveTextContent('1')
  await expect(submits).toHaveTextContent('0')

  await userEvent.click(submit)
  await expect(submits).toHaveTextContent('1')

  await userEvent.click(reset)
  await expect(resets).toHaveTextContent('1')
})
