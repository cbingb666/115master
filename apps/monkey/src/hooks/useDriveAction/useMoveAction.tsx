import type { Share } from '@115master/drive115'
import { promise } from '@115master/utils'
import { useAppDialog } from '@/app/dialog'
import { useFileBrowserDialog, useToast } from '@/components'
import { drive115 } from '@/utils/drive115Instance'
import { getFileIds } from './helpers'

/** 移动操作 */
export function useMoveAction() {
  const dialog = useAppDialog()
  const toast = useToast()
  const fileBrowser = useFileBrowserDialog()

  /** 移动对话框 */
  async function moveDialog(defaultpid: string): Promise<string | false> {
    const result = await fileBrowser.open({
      title: '移动到',
      defaultCid: defaultpid ?? '0',
    })
    return result ? result.cid : false
  }

  /** 获取移动进度（最大 100 次 ≈ 5 分钟，超限判定失败） */
  async function moveGetProgress(move_proid: string, retries = 100): Promise<number> {
    if (retries <= 0)
      throw new Error('移动进度查询超时')
    const res = await drive115.file.getFilesMoveProgress({
      move_proid,
    })
    if (res.progress === 100)
      return res.progress
    await promise.promiseDelay(3000)
    return moveGetProgress(move_proid, retries - 1)
  }

  /** 移动核心 */
  async function moveCore(pid: string, items: Share.Entity.FilesItem[]): Promise<boolean> {
    const fileIds = getFileIds(items)
    const fids = Object.fromEntries(
      fileIds.map((val, index) => [`fid[${index}]`, val]),
    )
    const move_proid = Date.now().toString()
    const res = await drive115.file.moveFiles({
      pid,
      ...fids,
      move_proid,
    })
    if (res.state) {
      try {
        const progress = await moveGetProgress(move_proid)
        if (progress === 100) {
          return Promise.resolve(true)
        }
      }
      catch {
        toast.error('移动超时，请稍后刷新确认')
        return Promise.resolve(false)
      }
    }
    else {
      await dialog.alert({
        title: '提示',
        content: res.message,
      })
    }

    return Promise.resolve(false)
  }

  /** 移动批量 */
  async function moveBatch(defaultPid: string, items: Share.Entity.FilesItem[]): Promise<{ success: boolean, pid: string }> {
    const pid = await moveDialog(defaultPid)
    if (!pid) {
      return { success: false, pid: '' }
    }
    const success = await moveCore(pid, items)
    return { success, pid }
  }

  /** 拖拽移动 */
  async function dragMove(cid: string, originItems: Share.Entity.FilesItem[]) {
    return await moveCore(cid, originItems)
  }

  /** 提到上级 */
  async function improve(items: Share.Entity.FilesItem[], prevLevelId: string): Promise<boolean> {
    const dialogRes = await dialog.confirm({
      title: '提到上级',
      content: '将文件提升到上级目录，确定提升吗？',
    })
    if (!dialogRes) {
      return false
    }

    const moveRes = await moveCore(prevLevelId, items)
    return moveRes
  }

  return {
    moveDialog,
    moveBatch,
    dragMove,
    improve,
  }
}
