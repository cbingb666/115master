import type { Share } from '@115master/drive115'
import { string } from '@115master/utils'
import { getFilesItemId } from '@/utils/filesItem'

/** 获取文件ID */
export function getFileIds(items: Share.Entity.FilesItem[]): string[] {
  return items.map(item => getFilesItemId(item))
}

/**
 * 拼接重命名后的完整文件名。
 * 115 重命名对话框仅编辑文件名主体（已去扩展名），服务端保留原扩展名；
 * 本地预测需把输入与原扩展名拼回，避免与最终服务端结果不一致。
 */
export function composeRenamedName(oldName: string, input: string): string {
  const ext = oldName.slice(string.removeFileExtension(oldName).length)
  return `${input}${ext}`
}
