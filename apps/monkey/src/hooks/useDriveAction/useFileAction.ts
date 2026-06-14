import type { Share } from '@115master/drive115'
import { Api } from '@115master/drive115'
import { useDialog, useToast } from '@/components'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'
import { removeFileExtension } from '@/utils/string'
import { getFileIds } from './helpers'

/** 文件基础操作（置顶、星标、重命名、新建文件夹） */
export function useFileAction() {
  const dialog = useDialog()
  const toast = useToast()

  /** 置顶批量 */
  async function topBatch(items: Share.Entity.FilesItem[]): Promise<boolean> {
    const hasTop = items.some(item => item.is_top === 1)
    const top = hasTop ? 0 : 1
    const fileIds = getFileIds(items)
    const res = await drive115.file.topFiles({
      file_id: fileIds.join(','),
      top,
    })
    if (res.state) {
      toast.success(hasTop ? '取消置顶成功' : '置顶成功')
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

  /** 星标批量 */
  async function starBatch(items: Share.Entity.FilesItem[]): Promise<boolean> {
    const hasStar = items.some(item => item.m === 1 || item.m === '1')
    const star = hasStar ? Api.FileApi.Req.MarkStatus.Unmark : Api.FileApi.Req.MarkStatus.Mark
    const fileIds = getFileIds(items)
    const res = await drive115.file.starFiles({
      file_id: fileIds,
      star,
    })
    if (res.state) {
      toast.success(hasStar ? '取消星标成功' : '星标成功')
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

  /** 重命名 */
  async function renameItem(item: Share.Entity.FilesItem): Promise<boolean> {
    const dialogRes = await dialog.prompt({
      title: '重命名',
      placeholder: '请输入文件名',
      defaultValue: removeFileExtension(item.n),
      multiline: true,
      rows: 3,
    })

    if (dialogRes) {
      if (/[\r\n]/.test(dialogRes)) {
        await dialog.alert({
          title: '提示',
          content: '文件名不支持换行',
        })
        return Promise.resolve(false)
      }

      const fid = getFilesItemId(item)
      const res = await drive115.file.batchRenameFiles({
        [`files_new_name[${fid}]`]: dialogRes,
      })
      if (res.state) {
        toast.success('重命名成功')
        return Promise.resolve(true)
      }
      else {
        await dialog.alert({
          title: '提示',
          content: res.error,
        })
      }
    }

    return Promise.resolve(false)
  }

  /** 新建文件夹 */
  async function newFolder(pid: string = '0', defaultValue: string = ''): Promise<boolean> {
    const dialogRes = await dialog.prompt({
      title: '新建文件夹',
      defaultValue,
      placeholder: '请输入文件夹名称',
      inputType: 'text',
      required: true,
      maxLength: 256,
    })

    if (dialogRes) {
      const res = await drive115.file.addFolder({
        pid,
        cname: dialogRes,
      })
      if (res.state) {
        toast.success('新建文件夹成功')
        return Promise.resolve(true)
      }
      else {
        await dialog.alert({
          title: '提示',
          content: res.error,
        })

        await newFolder(pid, dialogRes)
      }
    }

    return Promise.resolve(false)
  }

  return {
    topBatch,
    starBatch,
    renameItem,
    newFolder,
  }
}
