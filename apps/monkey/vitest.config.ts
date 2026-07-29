import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import vite from './.storybook/vite.config'

export default mergeConfig(vite, defineConfig({
  optimizeDeps: {
    include: [
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
          include: ['**/__tests__/**/*.test.ts'],
          coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: resolve(dirname(fileURLToPath(import.meta.url)), '.storybook'),
            initialGlobals: { theme: 'dark' },
          }),
        ],
        test: {
          name: 'storybook-dark',
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
}))
