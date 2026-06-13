import type { Entity } from '@115master/drive115'

/** 获取文件/目录项的统一标识（文件夹为 cid，文件为 fid） */
export function getFilesItemId(item: Entity.FilesItem): string {
  return item.fc === 0 ? item.cid : item.fid
}
