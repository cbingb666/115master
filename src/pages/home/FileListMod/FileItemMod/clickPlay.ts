import { GM_openInTab } from '$'
import { VOD_URL_115 } from '../../../../constants/115'
import { goToPlayer } from '../../../../utils/route'
import { IvType } from '../../types'
import { FileItemModBase } from './base'

/**
 * FileItemMod 点击播放
 */
export class FileItemModClickPlay extends FileItemModBase {
  /** 文件名节点 */
  get fileNameNode() {
    return (
      this.itemNode.querySelector('.file-thumb')
      ?? this.itemNode.querySelector('.file-name .name')
    )
  }

  /** 加载 */
  onLoad() {
    // 如果文件不是视频，则不进行操作
    if (this.itemInfo.attributes.iv !== IvType.Yes) {
      return
    }

    // 点击文件名 master 播放
    this.fileNameNode?.addEventListener(
      'click',
      this.handleClickPlayer.bind(this) as EventListener,
      true,
    )

    // 双击文件名 master 播放
    this.itemNode.addEventListener(
      'dblclick',
      this.handleClickPlayer.bind(this) as EventListener,
    )

    // 中键文件115播放
    this.itemNode.addEventListener(
      'auxclick',
      this.handleAuxclick.bind(this) as EventListener,
    )
  }

  /** 销毁 */
  onDestroy() {
    this.fileNameNode?.removeEventListener(
      'click',
      this.handleClickPlayer.bind(this) as EventListener,
      true,
    )
    this.itemNode.removeEventListener(
      'dblclick',
      this.handleClickPlayer.bind(this) as EventListener,
    )
    this.itemNode.removeEventListener(
      'auxclick',
      this.handleAuxclick.bind(this) as EventListener,
    )
  }

  /** 中键文件115播放 */
  private handleAuxclick(e: MouseEvent) {
    if (e.button === 1) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      GM_openInTab(
        new URL(
          `/?pickcode=${this.itemInfo.attributes.pick_code}&share_id=0`,
          VOD_URL_115,
        ).href,
        { active: true },
      )
    }
  }

  /** 点击文件名 master 播放 */
  private handleClickPlayer(e: Event) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    goToPlayer(
      {
        pickCode: this.itemInfo.attributes.pick_code,
        cid: this.itemInfo.attributes.cid,
      },
      true,
    )
  }
}
