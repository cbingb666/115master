import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'

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
] as const

const variants = [
  'solid',
  'soft',
  'outline',
  'dash',
  'ghost',
  'link',
  'glass-surface',
  'glass-inset',
  'glass-floating',
  'glass-overlay',
] as const

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

const meta = {
  title: 'UI/Button',
  component: Button,
  args: {
    color: 'primary',
    variant: 'solid',
    size: 'md',
    shape: 'default',
    active: false,
    block: false,
    loading: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        component: '原生动作按钮；link 与 Glass 仅改变视觉，始终保持按钮语义。',
      },
    },
  },
  tags: ['autodocs', 'test'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Contract: Story = {
  name: '公共契约',
  render: args => ({
    components: { Button },
    setup() {
      const actions = ref(0)
      const submits = ref(0)
      const act = () => actions.value += 1
      const submit = () => submits.value += 1

      return { actions, args, colors, sizes, submits, variants, act, submit }
    },
    template: `
      <main aria-label="Button contract" class="flex flex-col gap-8 p-6">
        <section aria-labelledby="button-interaction-title" class="flex flex-wrap items-center gap-3">
          <h1 id="button-interaction-title" class="w-full text-lg font-semibold">Interaction</h1>
          <Button v-bind="args" @click="act">
            <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4" fill="currentColor">
              <path d="M8 1.5 9.7 6.3 14.5 8l-4.8 1.7L8 14.5 6.3 9.7 1.5 8l4.8-1.7L8 1.5Z" />
            </svg>
            <span>Save changes</span>
          </Button>
          <output aria-live="polite" data-ui-button-actions>{{ actions }}</output>
          <Button disabled @click="act">Disabled action</Button>
          <Button loading @click="act">Loading action</Button>
          <Button shape="circle" aria-label="Settings icon action">
            <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
            </svg>
          </Button>
        </section>

        <form aria-label="Native form behavior" @submit.prevent="submit" class="flex flex-wrap items-center gap-3">
          <Button @click="act">Does not submit</Button>
          <button type="submit" class="btn">Native submit</button>
          <output aria-live="polite" data-ui-button-submits>{{ submits }}</output>
        </form>

        <section aria-labelledby="button-colors-title" class="flex flex-wrap items-center gap-3">
          <h2 id="button-colors-title" class="w-full text-lg font-semibold">Colors</h2>
          <Button v-for="color in colors" :key="color" :color="color">{{ color }}</Button>
        </section>

        <section aria-labelledby="button-variants-title" class="flex flex-wrap items-center gap-3">
          <h2 id="button-variants-title" class="w-full text-lg font-semibold">Variants</h2>
          <Button v-for="variant in variants" :key="variant" :variant="variant">{{ variant }}</Button>
        </section>

        <section aria-labelledby="button-sizes-title" class="flex flex-wrap items-center gap-3">
          <h2 id="button-sizes-title" class="w-full text-lg font-semibold">Sizes and states</h2>
          <Button v-for="size in sizes" :key="size" :size="size">{{ size }}</Button>
          <Button active>Active</Button>
          <Button block>Block</Button>
          <Button shape="square">Square</Button>
          <Button shape="circle" aria-label="Circle action">C</Button>
        </section>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const actions = canvasElement.querySelector<HTMLOutputElement>('[data-ui-button-actions]')
    const submits = canvasElement.querySelector<HTMLOutputElement>('[data-ui-button-submits]')

    if (!actions || !submits)
      throw new Error('Button contract story did not render its observable outcomes')

    const save = canvas.getByRole('button', { name: 'Save changes' })
    const disabled = canvas.getByRole('button', { name: 'Disabled action' })
    const loading = canvas.getByRole('button', { name: 'Loading action' })
    const formButton = canvas.getByRole('button', { name: 'Does not submit' })

    await expect(save).toHaveAttribute('type', 'button')
    await expect(save).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'Settings icon action' })).toBeVisible()
    await expect(disabled).toBeDisabled()
    await expect(loading).toBeDisabled()
    await expect(loading).toHaveAttribute('aria-busy', 'true')

    save.focus()
    await expect(save).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(actions).toHaveTextContent('1')

    await userEvent.click(save)
    await expect(actions).toHaveTextContent('2')

    await expect(actions).toHaveTextContent('2')

    await expect(formButton).toHaveAttribute('type', 'button')
    await userEvent.click(formButton)
    await expect(submits).toHaveTextContent('0')

    await userEvent.click(canvas.getByRole('button', { name: 'Native submit' }))
    await expect(submits).toHaveTextContent('1')
  },
}
