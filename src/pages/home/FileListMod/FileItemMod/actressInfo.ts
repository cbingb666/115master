import { actressFaceDB } from '../../../../utils/actressFaceDB'
import { imageCache } from '../../../../utils/cache'
import { compressImage } from '../../../../utils/image'
import { FileListType } from '../../types'
import { FileItemModBase } from './base'

/**
 * FileItemMod 演员信息
 */
export class FileItemModActressInfo extends FileItemModBase {
  readonly IS_PLUS = true

  async onLoad() {
    // 如果文件列表类型为网格，则不加载演员信息
    if (this.itemInfo.fileListType === FileListType.grid) {
      return
    }

    await actressFaceDB.init()
    const actress = await actressFaceDB.findActress(
      this.itemInfo.attributes.title.trim(),
    )
    if (!actress) {
      return
    }

    this.itemNode.classList.add('with-actress-info')
    const actressDom = document.createElement('img')
    actressDom.alt = actress.filename
    actressDom.loading = 'lazy'
    actressDom.className = 'actress-info-img'
    this.itemNode.querySelector('.file-name-wrap')?.prepend(actressDom)

    try {
      /** 尝试从缓存获取图片 */
      const cacheKey = `actress-face-${actress.url}`
      const cachedImage = await imageCache.get(cacheKey)

      if (cachedImage) {
        actressDom.src = URL.createObjectURL(cachedImage.value)
      }
      else {
        actressDom.src = actress.url
        try {
          const response = await fetch(actress.url)
          if (response.ok) {
            const blob = await response.blob()

            /** 压缩图片后再缓存 */
            const compressedBlob = await compressImage(blob, {
              maxWidth: 200,
              maxHeight: 200,
              quality: 0.8,
              type: 'image/webp',
            })

            // 存储到imageCache中
            await imageCache.set(cacheKey, compressedBlob)
          }
        }
        catch (error) {
          console.error('缓存演员头像失败:', error)
        }
      }
    }
    catch (error) {
      // 出错时直接使用原始URL
      console.error('加载演员头像缓存失败:', error)
      actressDom.src = actress.url
    }
  }

  onDestroy() {}
}
