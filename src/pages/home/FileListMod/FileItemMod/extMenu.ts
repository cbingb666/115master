import { GM_openInTab } from '$'
import iinaIcon from '../../../../assets/icons/iina-icon.png'
import { VOD_URL_115 } from '../../../../constants/115'
import { drive115 } from '../../../../utils/drive115'
import { isMac } from '../../../../utils/platform'
import { goToPlayer } from '../../../../utils/route'
import { webLinkIINA } from '../../../../utils/weblink'
import { FileListType, IvType } from '../../types'
import { FileItemModBase } from './base'

/**
 * 按钮配置
 */
interface ButtonConfig {
  /** 类名 */
  class: string
  /** 标题 */
  title: string
  /** 文本 */
  text: string
  /** 图标 */
  icon?: string
  /** 是否可见 */
  visible: boolean
  /** 点击事件 */
  click: () => void
}

/**
 * FileItemMod 扩展菜单
 */
export class FileItemModExtMenu extends FileItemModBase {
  /** 按钮配置 */
  get buttonConfig(): ButtonConfig[] {
    return [
      {
        class: '115-player',
        title: '使用【115官方播放器】',
        text: '5️⃣ 官方播放',
        visible: this.itemInfo.attributes.iv === IvType.Yes,
        click: () => {
          GM_openInTab(
            new URL(
              `/?pickcode=${this.itemInfo.attributes.pick_code}&share_id=0`,
              VOD_URL_115,
            ).href,
            { active: true },
          )
        },
      },
      ...(isMac
        ? [
            {
              class: 'iina-player',
              title: '使用【iina】',
              text: 'IINA',
              icon: iinaIcon,
              visible: this.itemInfo.attributes.iv === IvType.Yes,
              click: async () => {
                try {
                  const download = await drive115.getFileDownloadUrl(
                    this.itemInfo.attributes.pick_code,
                  )
                  open(webLinkIINA(download))
                }
                catch {
                  alert('打开iina失败')
                }
              },
            },
          ]
        : []),
      {
        class: 'master-player',
        title: '使用【Master播放器】',
        text: '▶️ Master 播放',
        visible: this.itemInfo.attributes.iv === IvType.Yes,
        click: () => {
          goToPlayer(
            {
              pickCode: this.itemInfo.attributes.pick_code,
              cid: this.itemInfo.attributes.cid,
            },
            true,
          )
        },
      },
    ]
  }

  /** 文件操作节点 */
  get fileOprNode() {
    return (
      this.itemNode.querySelector('.file-opr')
      ?? this.itemNode.querySelector('.file-opt')
    )
  }

  /** 加载 */
  onLoad() {
    // 如果文件列表类型为网格，则不加载扩展菜单
    if (this.itemInfo.fileListType === FileListType.grid) {
      return
    }

    this.createButtons()
  }

  /** 销毁 */
  onDestroy() {}

  /** 创建文件操作菜单按钮 */
  private createButtons(): void {
    this.buttonConfig.forEach((button) => {
      if (!button.visible)
        return
      const link = this.createNormalItemButtonElement(button)
      this.fileOprNode?.prepend(link)
      link.addEventListener('mousedown', async (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        button.click()
      })
    })
  }

  /** 创建普通文件项按钮元素 */
  private createNormalItemButtonElement(
    button: ButtonConfig,
  ): HTMLAnchorElement {
    const link = document.createElement('a')
    link.href = 'javascript:void(0)'
    link.className = button.class
    link.title = button.title
    link.style.cssText = `
      pointer-events: all;
      position: relative;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 4px;
    `

    if (button.icon) {
      const icon = document.createElement('img')
      icon.src = button.icon
      icon.style.cssText = 'width: 16px; height: 16px;'
      link.prepend(icon)
    }

    const textSpan = document.createElement('span')
    textSpan.textContent = button.text
    textSpan.style.pointerEvents = 'none'
    link.appendChild(textSpan)
    return link
  }
}
