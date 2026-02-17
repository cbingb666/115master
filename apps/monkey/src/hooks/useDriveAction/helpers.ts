import type { WebApi } from '@115master/drive115'

/** 获取文件ID */
export function getFileIds(items: WebApi.Entity.FilesItem[]): string[] {
  return items.map(item => item.fid ?? item.cid)
}
