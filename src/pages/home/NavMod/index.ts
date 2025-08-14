import { BaseMod } from '@/pages/home/BaseMod'

/**
 * 导航栏修改器
 * @description 添加 Master Drive 入口
 */
export default class NavMod extends BaseMod {
  constructor() {
    super()
    this.init()
  }

  /**
   * 销毁
   */
  destroy(): void {
  }

  /**
   * 初始化
   */
  private init(): void {
    const topDocument = window?.top?.document
    if (!topDocument) {
      console.error('topDocument 节点不存在')
      return
    }

    const panelNavNode = topDocument?.querySelector('.panel-nav')

    if (!panelNavNode) {
      console.error('panel-nav 节点不存在')
      return
    }

    if (panelNavNode.querySelector('.master-drive-link')) {
      return
    }

    const masterDriveLinkNode = topDocument.createElement('a')
    masterDriveLinkNode.classList.add('master-drive-link')
    masterDriveLinkNode.href = 'https://115.com/web/lixian/master/#/drive'
    masterDriveLinkNode.innerHTML = `
      <span>115Master</span>
    `
    masterDriveLinkNode.target = '_self'
    panelNavNode.appendChild(masterDriveLinkNode)
  }
}
