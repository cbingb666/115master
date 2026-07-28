import { dirname, resolve } from 'node:path'
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
      storybook('dark'),
      storybook('light', 'reduced-motion'),
      storybook('light', 'mobile'),
    ],
  },
}))
