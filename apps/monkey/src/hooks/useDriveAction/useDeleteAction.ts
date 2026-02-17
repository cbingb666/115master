import type { WebApi } from '@115master/drive115'
import { useDialog, useToast } from '@/components'
import { drive115 } from '@/utils/drive115Instance'
import { getFileIds } from './helpers'

/** 删除操作 */
export function useDeleteAction() {
  const dialog = useDialog()
  const toast = useToast()

  /** 删除确认 */
  async function deleteConfirm() {
    return dialog.confirm({
      title: '提示',
      content: '确定删除吗？',
    })
  }

  /** 删除批量 */
  async function deleteBatch(pid: string, items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const confirm = await deleteConfirm()
    if (!confirm) {
      return Promise.resolve(false)
    }

    const fileIds = getFileIds(items)
    const fids = Object.fromEntries(
      fileIds.map((val, index) => [`fid[${index}]`, val]),
    )
    const res = await drive115.webApiPostRbDelete({
      pid,
      ...fids,
    })
    if (res.state) {
      toast.success('删除成功')
      return Promise.resolve(true)
    }
    else {
      await dialog.alert({
        title: '提示',
        content: res.error,
      })
    }

    return Promise.resolve(false)
  }

  return {
    deleteBatch,
  }
}
