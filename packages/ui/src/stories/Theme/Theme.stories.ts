import { expect, within } from 'storybook/test'
import { computed } from 'vue'
import preview from '../../../.storybook/preview'
import './Theme.css'

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
      <main class="ui-theme-palette" aria-label="Theme 语义颜色映射">
        <header class="ui-theme-header">
          <p class="ui-theme-header__eyebrow">Foundations · Theme</p>
          <h1 class="ui-theme-header__title">同一组语义颜色</h1>
          <p class="ui-theme-header__copy">Light 与 Dark 改变视觉取值，不改变颜色角色。</p>
        </header>

        <div class="ui-theme-palette__themes">
          <section
            v-for="theme in ['light', 'dark']"
            :key="theme"
            :aria-label="theme === 'light' ? 'Light Theme 语义颜色' : 'Dark Theme 语义颜色'"
            class="ui-theme-palette__theme"
            :data-theme="theme"
            data-ui-theme-palette
          >
            <header class="ui-theme-palette__heading">
              <h2>{{ theme }}</h2>
              <code>data-theme="{{ theme }}"</code>
            </header>

            <div class="ui-theme-palette__swatches">
              <article
                v-for="color in colors"
                :key="color.name"
                class="ui-theme-swatch"
                :data-ui-theme-color="color.name"
              >
                <div class="ui-theme-swatch__sample" :style="color.style" aria-hidden="true">Aa</div>
                <div class="ui-theme-swatch__meta">
                  <strong>{{ color.label }}</strong>
                  <code>{{ color.background }}</code>
                  <code>{{ color.foreground }}</code>
                </div>
              </article>
            </div>
          </section>
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
      <main class="ui-theme-selection" aria-label="Theme 选择规则">
        <header class="ui-theme-header">
          <p class="ui-theme-header__eyebrow">Foundations · Theme</p>
          <h1 class="ui-theme-header__title">继承与显式选择</h1>
          <p class="ui-theme-header__copy">未声明的区域继承当前选择；data-theme 固定局部作用域。</p>
        </header>

        <div class="ui-theme-selection__grid">
          <section
            aria-label="继承的 Theme 选择"
            class="ui-theme-selection__scope"
            data-ui-theme-selection="inherited"
          >
            <div class="ui-theme-selection__sample" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div class="ui-theme-selection__meta">
              <h2>Inherited</h2>
              <p>Storybook: <output data-ui-theme-current>{{ current }}</output></p>
              <code>无 data-theme</code>
            </div>
          </section>

          <section
            aria-label="显式 Light Theme"
            class="ui-theme-selection__scope"
            data-theme="light"
            data-ui-theme-selection="explicit"
          >
            <div class="ui-theme-selection__sample" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div class="ui-theme-selection__meta">
              <h2>Light</h2>
              <p>Explicit scope</p>
              <code>data-theme="light"</code>
            </div>
          </section>

          <section
            aria-label="显式 Dark Theme"
            class="ui-theme-selection__scope"
            data-theme="dark"
            data-ui-theme-selection="explicit"
          >
            <div class="ui-theme-selection__sample" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div class="ui-theme-selection__meta">
              <h2>Dark</h2>
              <p>Explicit scope</p>
              <code>data-theme="dark"</code>
            </div>
          </section>
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
