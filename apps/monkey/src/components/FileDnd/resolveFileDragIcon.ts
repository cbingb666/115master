import type { Share } from '@115master/drive115'
import { I } from '@/icons'

const IMAGE = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tif', 'tiff', 'heic', 'heif']
const AUDIO = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'ape', 'wma']

/** 按首项文件类型解析跟随预览主图标，不引入 GM API。 */
export function resolveFileDragIcon(item: Share.Entity.FilesItem) {
  if (item.fc === 0)
    return I.FILE_FOLDER
  if (item.iv === 1)
    return I.FILE_VIDEO
  if (IMAGE.includes(item.ico))
    return I.FILE_IMAGE
  if (AUDIO.includes(item.ico))
    return I.AUDIO_TRACK
  return I.DOCUMENT
}
