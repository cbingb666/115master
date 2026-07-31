import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * 业务 E2E：纯路由拦截，不起服务器、不占端口
 * 分片并行：playwright test --shard=n/m（天然支持）
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
