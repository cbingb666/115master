import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import vite from './vite.config'

const root = dirname(fileURLToPath(import.meta.url))

function storybook(theme: 'light' | 'dark') {
  return {
    extends: true,
    plugins: [
      storybookTest({
        configDir: resolve(root, '.storybook'),
        initialGlobals: { theme },
      }),
    ],
    test: {
      name: `storybook-${theme}`,
      browser: {
        enabled: true,
        provider: playwright(),
        headless: true,
        instances: [{ browser: 'chromium' }],
      },
    },
  }
}

export default mergeConfig(vite, defineConfig({
  test: {
    projects: [storybook('light'), storybook('dark')],
  },
}))
