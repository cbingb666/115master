import type { Share } from '@115master/drive115'
import { I } from '@/icons'

const IMAGE = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tif', 'tiff', 'heic', 'heif']
const AUDIO = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'ape', 'wma']

/** 拖拽跟随图主图标：按首项类型映射（不经 Utils115，保持无 GM_* 依赖的可测性） */
export function dragIcon(item: Share.Entity.FilesItem) {
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
