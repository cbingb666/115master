import { GM_openInTab } from '$'
import iinaIcon from '@/assets/icons/iina-icon.png'
import { VOD_URL_115 } from '@/constants/115'
import { FileListType, IvType } from '@/pages/home/types'
import { drive115 } from '@/utils/drive115'
import { isMac } from '@/utils/platform'
import { goToPlayer } from '@/utils/route'
import { removeFileExtension } from '@/utils/string'
import { showToast } from '@/utils/toast'
import { generateVideoMontage } from '@/utils/videoMontage'
import { webLinkIINA } from '@/utils/weblink'
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
  /** 是否正在保存封面 */
  private savingCover = false

  /** 按钮配置 */
  get buttonConfig(): ButtonConfig[] {
    return [
      {
        class: 'save-cover',
        title: '生成视频九宫格封面并上传到当前目录（便于非浏览器客户端查看）',
        text: '🖼️ 保存封面',
        visible: this.itemInfo.attributes.iv === IvType.Yes,
        click: () => {
          this.saveCover()
        },
      },
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

  /**
   * 生成视频九宫格封面并上传到当前目录
   * @description 采集视频 9 帧拼成 3x3 合图，以「视频同名 + .jpg」上传到视频所在目录，
   * 方便通过非浏览器客户端查看网盘内视频的缩略图
   */
  private async saveCover(): Promise<void> {
    if (this.savingCover) {
      return
    }
    this.savingCover = true

    const { title, cid, pick_code: pickCode } = this.itemInfo.attributes
    const baseName = removeFileExtension(title || 'cover')
    const filename = `${baseName}.jpg`

    const toast = showToast('正在生成九宫格封面…', 'loading')

    try {
      /** 生成九宫格合图 */
      const blob = await generateVideoMontage({
        pickCode,
        duration: this.itemInfo.duration,
        title,
        onProgress: (progress) => {
          toast.update(
            `正在生成九宫格封面… ${Math.round(progress * 100)}%`,
            'loading',
          )
        },
      })

      /** 上传到视频所在目录 */
      toast.update('正在上传到当前目录…', 'loading')
      await drive115.uploadToDir(blob, filename, cid)

      toast.update(`封面已保存：${filename}`, 'success')
      toast.close(4000)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.update(`保存封面失败：${message}`, 'error')
      toast.close(6000)
    }
    finally {
      this.savingCover = false
    }
  }

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
