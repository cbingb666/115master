import { drive115 } from '../../../../utils/drive115'
import { is115Browser } from '../../../../utils/platform'
import { FileItemModBase } from './base'

/**
 * FileItemMod 文件下载
 */
export class FileItemModDownload extends FileItemModBase {
  get fileOprNode() {
    return this.itemNode.querySelector<HTMLElement>('.file-opr')
  }

  get downloadOneNode() {
    return this.fileOprNode?.querySelector<HTMLElement>(
      'a[menu="download_one"]',
    )
  }

  get downloadDirOneNode() {
    return this.fileOprNode?.querySelector<HTMLElement>(
      'a[menu="download_dir_one"]',
    )
  }

  onLoad() {
    if (!this.fileOprNode) {
      return
    }

    if (is115Browser) {
      return
    }

    if (this.downloadDirOneNode) {
      this.downloadDirOneNode.onclick = async (e) => {
        e.stopImmediatePropagation()
        e.preventDefault()

        alert('当前未支持文件夹下载')
      }
    }

    if (this.downloadOneNode) {
      this.downloadOneNode.onclick = async (e) => {
        e.stopImmediatePropagation()
        e.preventDefault()

        try {
          const res = await drive115.getFileDownloadUrl(
            this.itemInfo.attributes.pick_code,
          )
          if (res.url.url) {
            window.open(res.url.url, '_blank')
            return
          }

          throw new Error('下载失败')
        }
        catch (error: unknown) {
          if (error instanceof Error) {
            alert(error.message)
          }
          else {
            alert('下载失败')
          }
        }
      }
    }
  }

  onDestroy() {}
}
