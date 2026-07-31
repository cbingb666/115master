import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { FILES_RE, json } from '../../support'
import { boot, HEADER_BTN, headerBtn, record, row, watch } from './helpers'

const ADD_RE = /^https:\/\/webapi\.115\.com\/files\/add/

/** 打开新建文件夹对话框并填写名称 */
async function fillPrompt(page: Page, name: string) {
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('新建文件夹')
  await dialog.getByPlaceholder('请输入文件夹名称').fill(name)
  await dialog.getByRole('button', { name: '确认' }).click()
}

test.describe('新建文件夹', () => {
  test('提交后 POST /files/add 请求体正确并刷新列表', async ({ page }) => {
    const errors = watch(page)
    const gets = record(page, FILES_RE)
    const posts: (string | null)[] = []
    await boot(page, {
      mocks: api => api.override(ADD_RE, ({ route, request }) => {
        posts.push(request.postData())
        return json(route, { state: true })
      }),
    })
    const before = gets.length

    await headerBtn(page, HEADER_BTN.newFolder).click()
    await fillPrompt(page, '测试新建目录')

    /** 请求体：pid=当前目录 & cname=输入名（urlencoded） */
    await expect.poll(() => posts.length).toBe(1)
    const form = new URLSearchParams(posts[0] ?? '')
    expect(form.get('pid')).toBe('0')
    expect(form.get('cname')).toBe('测试新建目录')

    /** afterAction：失效缓存并刷新当前目录 → 再次 GET /files */
    await expect.poll(() => gets.length).toBeGreaterThan(before)
    /** 对话框关闭、列表仍正常渲染 */
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(row(page, '演示视频 01.mp4')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('服务端失败：alert 展示错误并重新弹出输入框', async ({ page }) => {
    const errors = watch(page)
    await boot(page, {
      mocks: api => api.override(ADD_RE, ({ route }) => {
        return json(route, { state: false, error: '名称已存在' })
      }),
    })

    await headerBtn(page, HEADER_BTN.newFolder).click()
    await fillPrompt(page, '测试新建目录')

    /** 失败 → alert 展示服务端 message（normalizeResponse: error → message） */
    const alert = page.getByRole('dialog')
    await expect(alert).toContainText('名称已存在')
    await alert.getByRole('button', { name: '确认' }).click()

    /** alert 关闭后递归重弹 prompt（保留上次输入） */
    await expect(alert).toContainText('新建文件夹')
    await expect(alert.getByPlaceholder('请输入文件夹名称')).toHaveValue('测试新建目录')
    /** 取消关闭，不再发请求 */
    await alert.getByRole('button', { name: '取消' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    expect(errors).toEqual([])
  })
})
