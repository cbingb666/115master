import { expect, within } from 'storybook/test'
import { computed } from 'vue'
import preview from '../../../.storybook/preview'

const colors = [
  {
    name: 'base-100',
    label: 'Base 100',
    background: '--color-base-100',
    foreground: '--color-base-content',
  },
  {
    name: 'base-200',
    label: 'Base 200',
    background: '--color-base-200',
    foreground: '--color-base-content',
  },
  {
    name: 'base-300',
    label: 'Base 300',
    background: '--color-base-300',
    foreground: '--color-base-content',
  },
  {
    name: 'primary',
    label: 'Primary',
    background: '--color-primary',
    foreground: '--color-primary-content',
  },
  {
    name: 'secondary',
    label: 'Secondary',
    background: '--color-secondary',
    foreground: '--color-secondary-content',
  },
  {
    name: 'accent',
    label: 'Accent',
    background: '--color-accent',
    foreground: '--color-accent-content',
  },
  {
    name: 'neutral',
    label: 'Neutral',
    background: '--color-neutral',
    foreground: '--color-neutral-content',
  },
  {
    name: 'info',
    label: 'Info',
    background: '--color-info',
    foreground: '--color-info-content',
  },
  {
    name: 'success',
    label: 'Success',
    background: '--color-success',
    foreground: '--color-success-content',
  },
  {
    name: 'warning',
    label: 'Warning',
    background: '--color-warning',
    foreground: '--color-warning-content',
  },
  {
    name: 'error',
    label: 'Error',
    background: '--color-error',
    foreground: '--color-error-content',
  },
].map(color => ({
  ...color,
  style: {
    backgroundColor: `var(${color.background})`,
    color: `var(${color.foreground})`,
  },
}))

const meta = preview.meta({
  title: 'Foundations/Theme',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: 'Theme 将同一套语义颜色角色映射为 light 或 dark；默认模式为 light，需要固定模式或嵌套主题时使用 data-theme 显式选择。它不是 dark class 或应用自有颜色表。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const SemanticColors = meta.story({
  name: '语义颜色',
  render: () => ({
    setup: () => ({ colors }),
    template: `
      <main class="min-h-screen bg-base-100 p-8 text-base-content max-sm:p-4" aria-label="Theme 语义颜色映射">
        <div class="mx-auto grid max-w-[76rem] gap-6">
        <header class="grid gap-3 rounded-box border border-base-300 bg-base-200 p-6">
          <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-base-content/65">Foundations · Theme</p>
          <h1 class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">同一组语义颜色</h1>
          <p class="m-0 max-w-2xl text-base-content/70">Light 与 Dark 改变视觉取值，不改变颜色角色。</p>
        </header>

        <div class="grid grid-cols-1 overflow-hidden rounded-box border border-base-300 min-[56rem]:grid-cols-2">
          <section
            v-for="theme in ['light', 'dark']"
            :key="theme"
            :aria-label="theme === 'light' ? 'Light Theme 语义颜色' : 'Dark Theme 语义颜色'"
            class="grid content-start gap-4 bg-base-100 p-5 text-base-content min-[56rem]:[&+&]:border-s min-[56rem]:[&+&]:border-base-300 max-[56rem]:[&+&]:border-t max-[56rem]:[&+&]:border-base-300"
            :data-theme="theme"
            data-ui-theme-palette
          >
            <header class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="m-0 text-lg capitalize">{{ theme }}</h2>
              <code class="text-xs">data-theme="{{ theme }}"</code>
            </header>

            <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
              <article
                v-for="color in colors"
                :key="color.name"
                class="overflow-hidden rounded-field border border-base-300 bg-base-100"
                :data-ui-theme-color="color.name"
              >
                <div class="grid min-h-20 place-items-center text-2xl font-extrabold" :style="color.style" aria-hidden="true">Aa</div>
                <div class="grid gap-0.5 bg-base-100 p-2.5 text-base-content">
                  <strong class="text-[0.8125rem]">{{ color.label }}</strong>
                  <code class="overflow-hidden text-ellipsis text-xs text-base-content/65">{{ color.background }}</code>
                  <code class="overflow-hidden text-ellipsis text-xs text-base-content/65">{{ color.foreground }}</code>
                </div>
              </article>
            </div>
          </section>
        </div>
        </div>
      </main>
    `,
  }),
})

SemanticColors.test('maps the same semantic roles across light and dark themes', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const light = canvas.getByRole('region', { name: 'Light Theme 语义颜色' })
  const dark = canvas.getByRole('region', { name: 'Dark Theme 语义颜色' })
  const lightStyle = getComputedStyle(light)
  const darkStyle = getComputedStyle(dark)
  const names = colors.map(color => color.name)
  const tokens = colors.flatMap(color => [color.background, color.foreground])

  await expect(light).toHaveAttribute('data-theme', 'light')
  await expect(dark).toHaveAttribute('data-theme', 'dark')
  await expect(lightStyle.colorScheme).toBe('light')
  await expect(darkStyle.colorScheme).toBe('dark')
  await expect([...light.querySelectorAll<HTMLElement>('[data-ui-theme-color]')].map(color => color.dataset.uiThemeColor)).toEqual(names)
  await expect([...dark.querySelectorAll<HTMLElement>('[data-ui-theme-color]')].map(color => color.dataset.uiThemeColor)).toEqual(names)
  await expect(tokens.every(token => lightStyle.getPropertyValue(token).trim())).toBe(true)
  await expect(tokens.every(token => darkStyle.getPropertyValue(token).trim())).toBe(true)
  await expect(lightStyle.getPropertyValue('--color-base-100')).not.toBe(darkStyle.getPropertyValue('--color-base-100'))
})

export const Selection = meta.story({
  name: '主题选择',
  render: (_args, context) => ({
    setup() {
      const current = computed(() => context.globals.theme === 'dark' ? 'dark' : 'light')

      return { current }
    },
    template: `
      <main class="min-h-screen bg-base-100 p-8 text-base-content max-sm:p-4" aria-label="Theme 选择规则">
        <div class="mx-auto grid max-w-[76rem] gap-6">
        <header class="grid gap-3 rounded-box border border-base-300 bg-base-200 p-6">
          <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-base-content/65">Foundations · Theme</p>
          <h1 class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">继承与显式选择</h1>
          <p class="m-0 max-w-2xl text-base-content/70">未声明的区域继承当前选择；data-theme 固定局部作用域。</p>
        </header>

        <div class="grid grid-cols-1 gap-4 min-[56rem]:grid-cols-3">
          <section
            aria-label="继承的 Theme 选择"
            class="grid gap-4 rounded-box border border-base-300 bg-base-100 p-5 text-base-content"
            data-ui-theme-selection="inherited"
          >
            <div class="grid min-h-32 grid-cols-3 overflow-hidden rounded-field bg-base-200" aria-hidden="true">
              <span class="bg-primary" />
              <span class="bg-secondary" />
              <span class="bg-accent" />
            </div>
            <div class="grid gap-1">
              <h2 class="m-0 text-lg">Inherited</h2>
              <p class="m-0 text-base-content/65">Storybook: <output class="font-bold text-base-content" data-ui-theme-current>{{ current }}</output></p>
              <code class="text-xs text-base-content/65">无 data-theme</code>
            </div>
          </section>

          <section
            aria-label="显式 Light Theme"
            class="grid gap-4 rounded-box border border-base-300 bg-base-100 p-5 text-base-content"
            data-theme="light"
            data-ui-theme-selection="explicit"
          >
            <div class="grid min-h-32 grid-cols-3 overflow-hidden rounded-field bg-base-200" aria-hidden="true">
              <span class="bg-primary" />
              <span class="bg-secondary" />
              <span class="bg-accent" />
            </div>
            <div class="grid gap-1">
              <h2 class="m-0 text-lg">Light</h2>
              <p class="m-0 text-base-content/65">Explicit scope</p>
              <code class="text-xs text-base-content/65">data-theme="light"</code>
            </div>
          </section>

          <section
            aria-label="显式 Dark Theme"
            class="grid gap-4 rounded-box border border-base-300 bg-base-100 p-5 text-base-content"
            data-theme="dark"
            data-ui-theme-selection="explicit"
          >
            <div class="grid min-h-32 grid-cols-3 overflow-hidden rounded-field bg-base-200" aria-hidden="true">
              <span class="bg-primary" />
              <span class="bg-secondary" />
              <span class="bg-accent" />
            </div>
            <div class="grid gap-1">
              <h2 class="m-0 text-lg">Dark</h2>
              <p class="m-0 text-base-content/65">Explicit scope</p>
              <code class="text-xs text-base-content/65">data-theme="dark"</code>
            </div>
          </section>
        </div>
        </div>
      </main>
    `,
  }),
})

Selection.test('keeps inherited and explicit theme selection observable', async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement)
  const root = canvasElement.querySelector<HTMLElement>('[data-ui-storybook-root]')
  const current = canvasElement.querySelector<HTMLOutputElement>('[data-ui-theme-current]')
  const inherited = canvas.getByRole('region', { name: '继承的 Theme 选择' })
  const light = canvas.getByRole('region', { name: '显式 Light Theme' })
  const dark = canvas.getByRole('region', { name: '显式 Dark Theme' })
  const theme = globals.theme === 'dark' ? 'dark' : 'light'

  if (!root || !current)
    throw new Error('Theme selection story did not render its observable selection')

  await expect(root).toHaveAttribute('data-theme', theme)
  await expect(current).toHaveTextContent(theme)
  await expect(inherited).not.toHaveAttribute('data-theme')
  await expect(getComputedStyle(inherited).colorScheme).toBe(theme)
  await expect(light).toHaveAttribute('data-theme', 'light')
  await expect(dark).toHaveAttribute('data-theme', 'dark')
  await expect(getComputedStyle(light).colorScheme).toBe('light')
  await expect(getComputedStyle(dark).colorScheme).toBe('dark')
  await expect(getComputedStyle(light).getPropertyValue('--color-base-100')).not.toBe(
    getComputedStyle(dark).getPropertyValue('--color-base-100'),
  )
})
