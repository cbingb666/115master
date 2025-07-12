import type { TopRootSearchParams } from '../global'
import { unsafeWindow } from '$'
import { getUrlParams } from '../../../utils/url'
import { userSettings } from '../../../utils/userSettings'
import { BaseMod } from '../BaseMod'
import { openOfflineTask } from './openOfflineTask'
import './index.css'
import 'iconify-icon'

/**
 * 顶部导航栏修改器
 * @description
 * 1. 添加自定义的云下载一级按钮
 * 2. 删除官方的云下载按钮
 * 3. 云下载按钮免除刷新重定向
 * 4. 添加预览切换开关
 */
export class TopHeaderMod extends BaseMod {
  constructor() {
    super()
    this.init()
  }

  /** 顶部导航栏节点 */
  get topHeaderNode() {
    return document.querySelector(unsafeWindow.Main.CONFIG.TopPanelBox)
      ?.firstElementChild as HTMLElement
  }

  /** 销毁 */
  destroy() {}

  /** 初始化 */
  private init() {
    if (!this.topHeaderNode)
      return
    const params = getUrlParams<TopRootSearchParams>(
      top?.window.location.search ?? '',
    )
    if (params.mode === 'search') {
      return
    }
    this.deleteOfficialDownloadButton()
    this.addMasterOfflineTaskButton()
    this.addPreviewSwitchButton()
    this.fixContextMenuPosition('upload_btn_add_dir')
    this.fixContextMenuPosition('create_new_add_dir')
  }

  /** 删除官方的离线任务按钮 */
  private deleteOfficialDownloadButton() {
    const downloadButton = this.topHeaderNode?.querySelector(
      '.button[menu=\'offline_task\']',
    )
    if (downloadButton) {
      downloadButton.remove()
    }
  }

  /** 添加 Master 离线任务按钮 */
  private addMasterOfflineTaskButton() {
    const button = this.createMasterOfflineTaskButton()
    this.topHeaderNode?.prepend(button)
  }

  /** 创建 Master 离线任务按钮 */
  private createMasterOfflineTaskButton() {
    const button = document.createElement('a')
    button.classList.add('button', 'master-offline-task-btn')
    button.href = 'javascript:void(0)'
    button.innerHTML = `
            <i class="icon-operate ifo-linktask"></i>
            <span>云下载</span>
        `
    button.style.background = '#3a4783'
    button.style.borderColor = '#3a4783'
    button.onclick = () => {
      openOfflineTask()
    }
    return button
  }

  /** 添加预览切换开关 */
  private addPreviewSwitchButton() {
    const button = this.createPreviewSwitchButton()
    this.topHeaderNode?.append(button)
  }

  /** 创建预览切换开关 */
  private createPreviewSwitchButton() {
    const value = userSettings.value.enableFilelistPreview
    const button = document.createElement('a')
    button.classList.add('button', 'btn-line', 'master-preview-switch-btn')
    if (value) {
      button.classList.add('active')
    }
    button.setAttribute('title', '开启文件预览')
    button.href = 'javascript:void(0)'
    button.innerHTML = `
      <iconify-icon class="preview-off" icon="material-symbols:preview-off" noobserver></iconify-icon>
      <iconify-icon class="preview-on" icon="material-symbols:preview" noobserver></iconify-icon>
    `
    button.onclick = () => {
      userSettings.value.enableFilelistPreview
        = !userSettings.value.enableFilelistPreview
      button.classList.toggle('active')
    }
    return button
  }

  /** 修正右键菜单位置 */
  private fixContextMenuPosition(name: string) {
    const tabNode = document.querySelector<HTMLElement>(
      `[data-dropdown-tab="${name}"]`,
    )
    const contextMenuNode = document.querySelector<HTMLElement>(
      `[data-dropdown-content="${name}"]`,
    )
    if (!tabNode || !contextMenuNode)
      return
    const tabRect = tabNode.getBoundingClientRect()
    contextMenuNode.style.left = `${tabRect.left}px`
  }
}
