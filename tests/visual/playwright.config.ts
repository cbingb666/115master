import { join } from 'node:path'
import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const repo = join(__dirname, '../..')

/** 端口可用环境变量覆盖，供并行 agent 错开端口 */
const ui = Number(process.env.VISUAL_UI_PORT ?? 6206)
const monkey = Number(process.env.VISUAL_MONKEY_PORT ?? 6207)

export default defineConfig({
  testDir: __dirname,
  outputDir: join(__dirname, 'test-results'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: `node ${join(__dirname, 'server.mjs')} ${join(repo, 'packages/ui/storybook-static')} ${ui}`,
      port: ui,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `node ${join(__dirname, 'server.mjs')} ${join(repo, 'apps/monkey/storybook-static')} ${monkey}`,
      port: monkey,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
