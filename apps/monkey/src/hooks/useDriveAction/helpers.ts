import type { Share } from '@115master/drive115'
import { getFilesItemId } from '@/utils/filesItem'

/** 获取文件ID */
export function getFileIds(items: Share.Entity.FilesItem[]): string[] {
  return items.map(item => getFilesItemId(item))
}
