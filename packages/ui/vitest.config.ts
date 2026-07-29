import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import vite from './vite.config'

const root = dirname(fileURLToPath(import.meta.url))

function storybook(theme: 'light' | 'dark', mode: 'default' | 'reduced-motion' | 'mobile' = 'default') {
  const name = mode === 'default' ? `storybook-${theme}` : `storybook-${mode}`
  const options = mode === 'reduced-motion'
    ? {
        contextOptions: {
          reducedMotion: 'reduce' as const,
        },
      }
    : mode === 'mobile'
      ? {
          contextOptions: {
            viewport: { width: 375, height: 667 },
          },
        }
      : undefined

  return {
    extends: true,
    plugins: [
      storybookTest({
        configDir: resolve(root, '.storybook'),
        initialGlobals: { theme },
      }),
    ],
    test: {
      name,
      browser: {
        enabled: true,
        provider: playwright(options),
        headless: true,
        instances: [{ browser: 'chromium' }],
      },
    },
  }
}

export default mergeConfig(vite, defineConfig({
  optimizeDeps: {
    include: [
      '@storybook/addon-a11y',
      '@storybook/addon-vitest',
      '@storybook/vue3-vite',
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/__tests__/**/*.test.ts'],
        },
      },
      storybook('light'),
      // addon-vitest 10.5.5 rewrites Manager projects from their shared configDir.
      ...(process.env.VITEST_STORYBOOK
        ? []
        : [
            storybook('dark'),
            storybook('light', 'reduced-motion'),
            storybook('light', 'mobile'),
          ]),
    ],
  },
}))
