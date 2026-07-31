import type { Page } from '@playwright/test'

/**
 * HOME specs 共享工具
 * - watch / gmStore: 通用 helper，自 support/index 转出
 * - replaceList: 模拟官方列表整体重渲染（替换 .list-cell），触发 FileListMod 的 MutationObserver
 */

/** 动态注入用的 li 属性（对齐官方 li 的关键属性） */
export interface LiSpec {
  title: string
  /** '1' 视频 */
  iv: '0' | '1'
  /** '0' 文件夹 / '1' 文件 */
  file_type: '0' | '1'
  pick_code: string
  sha1: string
  cate_id?: string
}

/** 收集 GM_openInTab 桩记录的新标签 URL（gmStubs 以 console.debug 输出） */
export function watchTabs(page: Page) {
  const urls: string[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.startsWith('[e2e] GM_openInTab:'))
      urls.push(text.replace('[e2e] GM_openInTab:', '').trim())
  })
  return urls
}

export { gmStore, watch } from './index'

/** 官方风格 li HTML */
function liHtml(item: LiSpec) {
  const opr = item.file_type === '0'
    ? '<a menu="download_dir_one" href="javascript:;" title="下载"></a>'
    : '<a menu="download_one" href="javascript:;" title="下载"></a>'
  const duration = item.iv === '1'
    ? '<span class="duration" duration="00:10:00">00:10:00</span>'
    : ''
  return `<li rel="item" cid="0" iv="${item.iv}" vdi="" title="${item.title}" hdf=""
      file_type="${item.file_type}" file_mode="" pick_code="${item.pick_code}" is_share="0"
      is_top="0" area_id="" p_id="" cate_id="${item.cate_id ?? ''}" cate_name="" score=""
      has_desc="" fl_encode="" fuuid="" shared="" has_pass="" issct="" sha1="${item.sha1}"
      file_size="100" play_button="">
      <div class="file-thumb"><img alt="" /></div>
      <div class="file-name-wrap">
        <div class="file-name"><a href="javascript:;" class="name"><span>${item.title}</span></a></div>
      </div>
      <div class="file-opr">${opr}</div>
      ${duration}
    </li>`
}

/** 生成新 .list-cell 的 HTML（导出给 spec 内 page.evaluate 用） */
export function listCellHtml(items: LiSpec[]) {
  return `<div class="list-contents"><ul>${items.map(liHtml).join('')}</ul></div>`
}

/**
 * 替换整个 .list-cell（模拟官方切目录/刷新列表的重渲染）
 * FileListMod 的 MutationObserver 只监听 DataListBox 直接子节点，整体替换才会触发增量增强
 */
export async function replaceList(page: Page, items: LiSpec[]) {
  await page.evaluate((inner) => {
    const box = document.querySelector('#js_data_list_box')!
    const cell = document.createElement('div')
    cell.className = 'list-cell'
    cell.innerHTML = inner
    box.querySelector('.list-cell')?.remove()
    box.append(cell)
  }, listCellHtml(items))
}
