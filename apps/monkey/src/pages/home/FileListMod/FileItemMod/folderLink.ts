import { CONSTANT } from '@115master/drive115'
import { FileType } from '@/pages/home/types'
import { FileItemModBase } from './base'

/**
 * FileItemModFolderLink 文件夹链接修改
 * @description 修改文件夹 a 标签链接（支持鼠标中键新标签打开）
 */
export class FileItemModFolderLink extends FileItemModBase {
  get fileNameNode() {
    return this.itemNode.querySelector('.file-name')
  }

  get fileAtagNode() {
    return this.fileNameNode?.querySelector('a') as HTMLAnchorElement | null
  }

  onLoad() {
    if (this.itemInfo.attributes.file_type !== FileType.folder) {
      return
    }

    this.modFolderATagLink()
  }

  onDestroy() {
    // noop
  }

  private modFolderATagLink() {
    const aNode = this.fileAtagNode
    if (!aNode) {
      return
    }

    if (aNode.href.includes('javascript:;')) {
      const newHref = new URL(
        `/?cid=${this.itemInfo.attributes.cate_id}&offset=0&tab=&mode=wangpan`,
        CONSTANT.URL_115.NORMAL,
      ).href
      aNode.href = newHref
    }
  }
}
