import type { App } from 'vue'
import { createApp } from 'vue'
import { PLUS_VERSION } from '../../../../constants'
import mainStyles from '../../../../styles/main.css?inline'
import ExtVideoCover from '../../components/ExtVideoCover/index.vue'
import { FileListType, IvType } from '../../types'
import { FileItemModBase } from './base'

/**
 * FileItemMod 视频封面
 */
export class FileItemModVideoCover extends FileItemModBase {
  readonly ENABLE_KEY_IN_USER_SETTING = 'enableFilelistPreview'

  private vueApp: App | null = null

  onLoad() {
    // 如果文件列表类型为网格，则不加载
    if (this.itemInfo.fileListType === FileListType.grid) {
      return
    }

    // 如果有番号并且是Plus版本，则不加载
    if (this.itemInfo.avNumber && PLUS_VERSION) {
      return
    }

    // 如果视频不是视频，则不加载
    if (this.itemInfo.attributes.iv !== IvType.Yes) {
      return
    }

    this.itemNode.classList.add('with-ext-video-cover')

    /** 创建容器元素 */
    const container = document.createElement('div')
    container.style.width = '100%'
    this.itemNode.append(container)

    /** 创建 shadow DOM */
    const shadowRoot = container.attachShadow({ mode: 'open' })

    /** 在 shadow DOM 中添加样式 */
    const styleElement = document.createElement('style')
    styleElement.textContent = mainStyles
    shadowRoot.appendChild(styleElement)

    /** 在 shadow DOM 中创建挂载点 */
    const root = document.createElement('div')
    root.className = 'ext-video-cover-root'
    root.setAttribute('data-theme', 'light')
    shadowRoot.appendChild(root)

    /** 创建并挂载 Vue 应用 */
    const app = createApp(ExtVideoCover, {
      pickCode: this.itemInfo.attributes.pick_code,
      sha1: this.itemInfo.attributes.sha1,
      duration: String(this.itemInfo.duration),
      listScrollBoxNode: this.itemInfo.listScrollBoxNode,
    })
    app.mount(root)
    this.vueApp = app
  }

  onDestroy() {
    this.vueApp?.unmount()
  }
}
