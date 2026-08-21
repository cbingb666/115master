import { expect, test } from '@playwright/test'
import { json, MASTER_URL, setupHarness, watch } from '../../support'

const LABEL_RE = /^https:\/\/webapi\.115\.com\/label\/list/

test('标签列表复用 CollectionSelection 的激活、多选、右键与长按', async ({ page }) => {
  const errors = watch(page)
  await setupHarness(page, {
    mocks: api => api.override(LABEL_RE, ({ route }) => json(route, {
      state: true,
      data: {
        total: 3,
        list: [
          { id: '1', name: '电影', color: '#FF4B30' },
          { id: '2', name: '音乐', color: '#2670FC' },
          { id: '3', name: '剧集', color: '#34C759' },
        ],
      },
    })),
  })
  await page.goto(`${MASTER_URL}#/tags`)

  const row = (name: string) => page.locator(`[data-ui-collection-selection-key]:has(span[title="${name}"])`)
  const exit = page.getByTitle('退出多选')
  await expect(row('电影')).toBeVisible()

  await row('电影').click()
  await expect(exit).toContainText('1 项')
  await row('音乐').click({ modifiers: ['Meta'] })
  await expect(exit).toContainText('2 项')

  await page.keyboard.press('Escape')
  await expect(exit).toHaveCount(0)

  await row('剧集').click({ button: 'right' })
  await expect(page.getByRole('menuitem')).toHaveText(['编辑', '删除'])
  await page.keyboard.press('Escape')
  await exit.click()

  const box = await row('音乐').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(220)
  await page.mouse.up()
  await expect(exit).toContainText('1 项')
  await expect(row('音乐')).toHaveAttribute('data-checked', 'true')

  expect(errors).toEqual([])
})
