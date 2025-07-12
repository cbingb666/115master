import type { App } from 'vue'
import { defer } from 'lodash'
import { createApp } from 'vue'
import mainStyles from '../../../../styles/main.css?inline'
import ExtInfo from '../../components/ExtInfo/index.vue'
import { FileListType, FileType, IvType } from '../../types'
import { FileItemModBase } from './base'

/**
 * FileItemMod 扩展信息
 */
export class FileItemModExtInfo extends FileItemModBase {
  readonly IS_PLUS = true
  readonly ENABLE_KEY_IN_USER_SETTING = 'enableFilelistPreview'

  private vueApp: App | null = null

  onLoad() {
    // 如果文件列表类型为网格，则不加载扩展信息
    if (this.itemInfo.fileListType === FileListType.grid) {
      return
    }

    // 如果视频不可播放且不是文件夹，则不加载扩展信息
    if (
      this.itemInfo.attributes.iv !== IvType.Yes
      && this.itemInfo.attributes.file_type !== FileType.folder
    ) {
      return
    }

    // 如果视频没有番号，则不加载扩展信息
    if (!this.itemInfo.avNumber) {
      return
    }

    this.itemNode.classList.add('with-ext-info')

    /** 创建容器元素 */
    const extInfoContainer = document.createElement('div')
    extInfoContainer.style.width = '100%'
    this.itemNode.append(extInfoContainer)

    /** 创建 shadow DOM */
    const shadowRoot = extInfoContainer.attachShadow({ mode: 'open' })

    /** 在 shadow DOM 中添加样式 */
    const styleElement = document.createElement('style')
    styleElement.textContent = mainStyles
    shadowRoot.appendChild(styleElement)

    /** 在 shadow DOM 中创建挂载点 */
    const extInfoDom = document.createElement('div')
    extInfoDom.className = 'ext-info-root'
    extInfoDom.setAttribute('data-theme', 'light')
    shadowRoot.appendChild(extInfoDom)

    /** 创建并挂载 Vue 应用 */
    const app = createApp(ExtInfo, {
      avNumber: this.itemInfo.avNumber,
    })
    app.mount(extInfoDom)
    this.vueApp = app
  }

  onDestroy() {
    /** 延迟卸载 Vue，避免阻塞新的文件列表加载 */
    defer(() => {
      this.vueApp?.unmount()
    })
  }
}
