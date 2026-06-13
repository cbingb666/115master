import type { Entity } from '@115master/drive115'
import { getFilesItemId } from '@/utils/filesItem'

/** 获取文件ID */
export function getFileIds(items: Entity.FilesItem[]): string[] {
  return items.map(item => getFilesItemId(item))
}
