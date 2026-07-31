import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { expect, test } from '@playwright/test'

interface Entry {
  type: string
  subtype?: string
}

/** 两套 storybook 均在 preview.ts 定义 theme global（light/dark） */
const books = [
  {
    name: 'ui',
    root: join(__dirname, '../../packages/ui/storybook-static'),
    port: Number(process.env.VISUAL_UI_PORT ?? 6206),
    themes: ['light', 'dark'],
  },
  {
    name: 'monkey',
    root: join(__dirname, '../../apps/monkey/storybook-static'),
    port: Number(process.env.VISUAL_MONKEY_PORT ?? 6207),
    themes: ['light', 'dark'],
  },
]

/** 等待故事渲染、字体与图片就绪后短暂稳定 */
async function ready(page: Page) {
  const root = page.locator('#storybook-root')
  await root.locator(':scope > *').first().waitFor({ state: 'visible' })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(img => img.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true })
          img.addEventListener('error', resolve, { once: true })
        })))
  })
  await page.waitForTimeout(200)
}

for (const book of books) {
  const index = JSON.parse(readFileSync(join(book.root, 'index.json'), 'utf8')) as { entries: Record<string, Entry> }
  /** 仅取真实故事：跳过 docs 与显式测试条目（subtype 'test'） */
  const stories = Object.keys(index.entries).filter(id => index.entries[id].type === 'story' && index.entries[id].subtype !== 'test')

  test.describe(book.name, () => {
    for (const id of stories) {
      for (const theme of book.themes) {
        test(`${id} [${theme}]`, async ({ page }) => {
          await page.goto(`http://127.0.0.1:${book.port}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
          await ready(page)
          await expect(page).toHaveScreenshot([book.name, `${id}-${theme}.png`], {
            animations: 'disabled',
            caret: 'hide',
            fullPage: true,
            maxDiffPixelRatio: 0.01,
          })
        })
      }
    }
  })
}
