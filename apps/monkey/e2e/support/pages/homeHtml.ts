import type { Item } from '../fixtures/files'
import { dirs } from '../fixtures/files'

/**
 * HOME 模式官方页面 fixture
 * 模拟 115 官方文件列表 DOM，让 FileListMod 等 Mod 能找到挂载点：
 * - window.Main.CONFIG.DataListBox 指向文件列表容器（FileListMod 依赖）
 * - window.FileMainReInstanceSetting 提供滚动定位参数（FileListScrollHistory 依赖）
 * - li 上的 iv/file_type/pick_code/sha1/title 等属性对齐 FileItemAttributes
 */

/** 顶部路径链接（对应 .file-path 下的官方 a[titletext][cid]） */
export interface PathLink {
  title: string
  cid: string
}

export interface HomeHtmlOptions {
  /** 顶部路径（默认仅根目录；传多级模拟子目录页面，驱动 TopFilePathMod 返回按钮） */
  paths?: PathLink[]
  /** 列表视图模式（默认 list 对应 .list-contents；grid 对应 .list-thumb） */
  view?: 'list' | 'grid'
}

function li(item: Item) {
  const attrs = {
    rel: 'item',
    c: '',
    cid: '0',
    iv: String(item.iv),
    vdi: item.vdi ? String(item.vdi) : '',
    title: item.n,
    hdf: '',
    file_type: String(item.fc),
    file_mode: '',
    pick_code: item.pc,
    is_share: '0',
    is_top: '0',
    area_id: '',
    p_id: '',
    cate_id: item.cid ?? '',
    cate_name: '',
    score: '',
    has_desc: '',
    fl_encode: '',
    fuuid: '',
    shared: '',
    has_pass: '',
    issct: '',
    sha1: item.sha,
    file_size: String(item.s),
    play_button: '',
  }
  const attrText = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')
  const opr = item.fc === 0
    ? '<a menu="download_dir_one" href="javascript:;" title="下载"></a>'
    : '<a menu="download_one" href="javascript:;" title="下载"></a>'
  const duration = item.iv === 1
    ? '<span class="duration" duration="01:23:45">01:23:45</span>'
    : ''
  return `
      <li ${attrText}>
        <div class="file-thumb"><img alt="" /></div>
        <div class="file-name-wrap">
          <div class="file-name"><a href="javascript:;" class="name"><span>${item.n}</span></a></div>
        </div>
        <div class="file-opr">${opr}</div>
        ${duration}
      </li>`
}

/** 生成官方首页 HTML（文件列表用根目录 fixture 数据） */
export function homeHtml(options: HomeHtmlOptions = {}) {
  const items = dirs['0'].items
  const paths = options.paths ?? [{ title: '根目录', cid: '0' }]
  const listClass = options.view === 'grid' ? 'list-thumb' : 'list-contents'
  const pathLinks = paths
    .map(p => `<a href="javascript:;" titletext="${p.title}" cid="${p.cid}">${p.title}</a>`)
    .join('')
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>115，一生相伴</title>
<script>
  window.Main = {
    CONFIG: {
      DataListBox: '#js_data_list_box',
      TopPanelBox: '#js_top_panel_box',
    },
  }
  window.FileMainReInstanceSetting = { cid: '0', offset: 0, limit: 115 }
</script>
</head>
<body>
  <div class="panel-nav">
    <a href="javascript:;">网盘</a>
  </div>
  <div id="js_top_header_file_path_box">
    <div class="common-little-pop"></div>
  </div>
  <div id="js_top_panel_box">
    <div>
      <a class="button" menu="offline_task" href="javascript:;"><span>云下载</span></a>
      <a class="button" menu="upload_btn_add_dir" href="javascript:;" data-dropdown-tab="upload_btn_add_dir"><span>上传</span></a>
      <a class="button" menu="create_new_add_dir" href="javascript:;" data-dropdown-tab="create_new_add_dir"><span>新建</span></a>
    </div>
  </div>
  <div data-dropdown-content="upload_btn_add_dir" style="position: absolute;"></div>
  <div data-dropdown-content="create_new_add_dir" style="position: absolute;"></div>
  <div class="list-topheader">
    <div class="top-file-path">
      <div class="file-path">
        ${pathLinks}
      </div>
    </div>
  </div>
  <div id="js_data_list_box">
    <div class="list-cell">
      <div class="${listClass}">
        <ul>${items.map(li).join('')}
        </ul>
      </div>
    </div>
  </div>
</body>
</html>`
}
