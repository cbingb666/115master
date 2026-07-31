import { expect, test } from '@playwright/test'
import { HOME_URL, json, setupHarness } from '../../support'
import { gmStore, replaceList, watch, watchTabs } from '../../support/homeUtils'
import { html } from '../../support/mockApi'
import { homeHtml } from '../../support/pages/homeHtml'

/**
 * FileListMod：文件列表增强（FileItemMod 插件数组）
 * 普通构建下加载的 itemMod：folderLink / videoCover / extMenu / clickPlay / download
 * （extInfo / actressInfo 为 IS_PLUS，普通构建跳过）
 */
test.describe('FileListMod', () => {
  test('初始加载：按项类型注入对应增强', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    // 40 个视频项注入 Master / 官方播放按钮（FileItemModExtMenu）
    // 注：类名 115-player 以数字开头，须用属性选择器
    await expect(page.locator('a.master-player')).toHaveCount(40)
    await expect(page.locator('a[class="115-player"]')).toHaveCount(40)
    const masterBtn = page.locator('li[iv="1"] a.master-player').first()
    await expect(masterBtn).toHaveAttribute('title', '使用【Master播放器】')
    await expect(masterBtn).toHaveText('Master 播放')
    const officialBtn = page.locator('li[iv="1"] a[class="115-player"]').first()
    await expect(officialBtn).toHaveAttribute('title', '使用【115官方播放器】')
    await expect(officialBtn).toHaveText('官方播放')

    // 视频项注入封面容器（FileItemModVideoCover）：li 加类 + shadow 挂载点跟随主题
    await expect(page.locator('li.with-ext-video-cover')).toHaveCount(40)
    const coverRoot = page.locator('li.with-ext-video-cover .ext-video-cover-root').first()
    await expect(coverRoot).toBeAttached()
    await expect(coverRoot).toHaveAttribute('data-theme', 'dark')

    // 文件夹 a 标签链接重写为可新标签打开的目录链接（FileItemModFolderLink）
    await expect(page.locator('li[title="动漫"] .file-name a'))
      .toHaveAttribute('href', 'https://115.com/?cid=1001&offset=0&tab=&mode=wangpan')
    await expect(page.locator('li[title="电影"] .file-name a'))
      .toHaveAttribute('href', 'https://115.com/?cid=1002&offset=0&tab=&mode=wangpan')

    // 非视频项（文件夹 / 文档）不注入播放按钮与封面
    await expect(page.locator('li[title="动漫"] a.master-player')).toHaveCount(0)
    await expect(page.locator('li[title="动漫"]')).not.toHaveClass(/with-ext-video-cover/)
    await expect(page.locator('li[title="说明文档.pdf"] a.master-player')).toHaveCount(0)
    await expect(page.locator('li[title="说明文档.pdf"]')).not.toHaveClass(/with-ext-video-cover/)

    expect(errors).toEqual([])
  })

  test('MutationObserver：列表重渲染后新增 li 被增量增强', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)
    await expect(page.locator('a.master-player')).toHaveCount(40)

    // 模拟官方列表整体重渲染：新增一个番号视频项 + 一个文件夹
    await replaceList(page, [
      { title: 'ABP-123 动态视频.mp4', iv: '1', file_type: '1', pick_code: 'dynamicVideoPick', sha1: 'DYNAMICSHA1' },
      { title: '动态文件夹', iv: '0', file_type: '0', pick_code: '', sha1: '', cate_id: '2001' },
    ])

    const video = page.locator('li[pick_code="dynamicVideoPick"]')
    await expect(video.locator('a.master-player')).toBeAttached()
    await expect(video).toHaveClass(/with-ext-video-cover/)
    await expect(page.locator('li[title="动态文件夹"] .file-name a'))
      .toHaveAttribute('href', 'https://115.com/?cid=2001&offset=0&tab=&mode=wangpan')
    // 旧列表项已被移除
    await expect(page.locator('li[title="动漫"]')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('MutationObserver：列表项移除后旧增强销毁、无泄漏报错', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)
    await expect(page.locator('li.with-ext-video-cover')).toHaveCount(40)

    // 重渲染为仅 1 项：43 个旧 itemModLoader 全部销毁
    await replaceList(page, [
      { title: '仅存视频.mp4', iv: '1', file_type: '1', pick_code: 'onlyOnePick', sha1: 'ONLYSHA1' },
    ])
    await expect(page.locator('.list-cell li')).toHaveCount(1)
    await expect(page.locator('li.with-ext-video-cover')).toHaveCount(1)
    await expect(page.locator('a.master-player')).toHaveCount(1)
    expect(errors).toEqual([])
  })

  test('网格模式：不注入扩展菜单与视频封面，文件夹链接仍重写', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page, {
      mocks: api => api.override(/^https:\/\/115\.com\/\?/, ({ route, request }) => {
        if (!request.isNavigationRequest())
          return
        return html(route, homeHtml({ view: 'grid' }))
      }),
    })
    await page.goto(HOME_URL)

    // extMenu / videoCover 在 grid 下跳过
    await expect(page.locator('li[title="动漫"]')).toBeAttached()
    await expect(page.locator('a.master-player')).toHaveCount(0)
    await expect(page.locator('li.with-ext-video-cover')).toHaveCount(0)
    // folderLink 不受视图模式限制
    await expect(page.locator('li[title="动漫"] .file-name a'))
      .toHaveAttribute('href', 'https://115.com/?cid=1001&offset=0&tab=&mode=wangpan')
    expect(errors).toEqual([])
  })

  test('Plus 门控：普通构建不出现 Plus 增强', async ({ page }) => {
    const errors = watch(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    // 注入带番号的视频项：Plus 构建下会出现 extInfo，普通构建必须没有
    await replaceList(page, [
      { title: 'ABP-123 番号视频.mp4', iv: '1', file_type: '1', pick_code: 'avNumberPick', sha1: 'AVSHA1' },
    ])
    const video = page.locator('li[pick_code="avNumberPick"]')
    await expect(video.locator('a.master-player')).toBeAttached()
    await expect(page.locator('li.with-ext-info')).toHaveCount(0)
    await expect(page.locator('.ext-info-root')).toHaveCount(0)
    await expect(page.locator('li.with-actress-info')).toHaveCount(0)
    await expect(page.locator('.actress-info-img')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test.describe('FileItemMod 交互', () => {
  test('双击视频项：跳转 Master 播放器', async ({ page }) => {
    const errors = watch(page)
    const tabs = watchTabs(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    const video = page.locator('li[iv="1"]').first()
    const pickCode = await video.getAttribute('pick_code')
    await video.dblclick()

    // goToPlayer：GM_setValue 记录播放信息 + GM_openInTab 打开 master 视频页
    await expect.poll(async () => {
      const store = await gmStore(page)
      return (store.playingVideoInfo as { pickCode?: string } | undefined)?.pickCode
    }).toBe(pickCode)
    await expect.poll(() => tabs.length).toBeGreaterThan(0)
    expect(tabs[0]).toBe(`https://115.com/web/lixian/master/#/video/${pickCode}`)
    expect(errors).toEqual([])
  })

  test('中键点击视频项：打开 115 官方播放页', async ({ page }) => {
    const errors = watch(page)
    const tabs = watchTabs(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    const video = page.locator('li[iv="1"]').first()
    const pickCode = await video.getAttribute('pick_code')
    await video.click({ button: 'middle' })

    await expect.poll(() => tabs.length).toBeGreaterThan(0)
    expect(tabs[0]).toBe(`https://115vod.com/?pickcode=${pickCode}&share_id=0`)
    expect(errors).toEqual([])
  })

  test('扩展菜单按钮：Master 播放 / 官方播放分别跳转对应播放器', async ({ page }) => {
    const errors = watch(page)
    const tabs = watchTabs(page)
    await setupHarness(page)
    await page.goto(HOME_URL)

    const video = page.locator('li[iv="1"]').first()
    const pickCode = await video.getAttribute('pick_code')

    // 按钮通过 mousedown 触发
    await video.locator('a.master-player').click()
    await expect.poll(async () => {
      const store = await gmStore(page)
      return (store.playingVideoInfo as { pickCode?: string } | undefined)?.pickCode
    }).toBe(pickCode)
    expect(tabs[0]).toBe(`https://115.com/web/lixian/master/#/video/${pickCode}`)

    await video.locator('a[class="115-player"]').click()
    await expect.poll(() => tabs.length).toBe(2)
    expect(tabs[1]).toBe(`https://115vod.com/?pickcode=${pickCode}&share_id=0`)
    expect(errors).toEqual([])
  })

  test('文件下载按钮：获取下载地址并新窗口打开', async ({ page }) => {
    const errors = watch(page)
    const fileUrl = 'https://cdnfhnfile.115cdn.net/e2e/download.mp4'
    const requested: (string | null)[] = []
    // Pro 接口默认 mock 固定失败 → 走 webapi 兜底，这里覆盖兜底接口给出下载地址
    await setupHarness(page, {
      mocks: api => api.override(/^https:\/\/webapi\.115\.com\/files\/download/, ({ route, url }) => {
        requested.push(url.searchParams.get('pickcode'))
        return json(route, { state: true, file_url: fileUrl })
      }),
    })
    await page.addInitScript(() => {
      (window as unknown as { __opened: string[] }).__opened = []
      window.open = (url) => {
        (window as unknown as { __opened: string[] }).__opened.push(String(url))
        return null
      }
    })
    await page.goto(HOME_URL)

    const video = page.locator('li[iv="1"]').first()
    const pickCode = await video.getAttribute('pick_code')
    // 官方下载按钮为无内容的空 a 标签（无 CSS 时不可见），直接派发 click 触发 onclick
    await video.locator('a[menu="download_one"]').dispatchEvent('click')

    await expect.poll(() => requested.length).toBeGreaterThan(0)
    expect(requested[0]).toBe(pickCode)
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __opened: string[] }).__opened),
    ).toContain(fileUrl)
    expect(errors).toEqual([])
  })

  test('文件夹下载按钮：提示暂不支持', async ({ page }) => {
    const errors = watch(page)
    const dialogs: string[] = []
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message())
      dialog.dismiss()
    })
    await setupHarness(page)
    await page.goto(HOME_URL)

    // 同上：空 a 标签不可见，直接派发 click
    await page.locator('li[title="动漫"] a[menu="download_dir_one"]').dispatchEvent('click')
    await expect.poll(() => dialogs).toEqual(['当前未支持文件夹下载'])
    expect(errors).toEqual([])
  })
})
