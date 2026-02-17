import type { WebApi } from '@115master/drive115'
import { ref } from 'vue'
import { FileBroswer, useDialog, useToast } from '@/components'
import { drive115 } from '@/utils/drive115Instance'
import { promiseDelay } from '@/utils/promise'
import { getFileIds } from './helpers'

/** 移动操作 */
export function useMoveAction() {
  const dialog = useDialog()
  const toast = useToast()

  /** 移动对话框 */
  async function moveDialog(defaultpid: string): Promise<string | false> {
    const query = {
      keyword: ref(''),
      page: ref(1),
      size: ref(20),
      cid: ref(defaultpid ?? '0'),
      area: ref(''),
      suffix: ref(''),
      type: ref(''),
      nf: ref('1'),
    }

    return new Promise((resolve) => {
      dialog.create({
        title: '移动到',
        maskClosable: true,
        className: 'sm:w-11/12! sm:max-w-5xl! h-5/6!',
        content: () => <FileBroswer query={query} />,
        confirmCallback: () => {
          resolve(query.cid.value)
        },
        cancelCallback: () => {
          resolve(false)
        },
      })
    })
  }

  /** 获取移动进度 */
  async function moveGetProgress(move_proid: string) {
    const res = await drive115.webApiGetFilesMoveProgress({
      move_proid,
    })
    if (res.progress === 100) {
      return Promise.resolve(res.progress)
    }
    await promiseDelay(3000)
    return moveGetProgress(move_proid)
  }

  /** 移动核心 */
  async function moveCore(pid: string, items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const fileIds = getFileIds(items)
    const fids = Object.fromEntries(
      fileIds.map((val, index) => [`fid[${index}]`, val]),
    )
    const move_proid = Date.now().toString()
    const res = await drive115.webApiPostFilesMove({
      pid,
      ...fids,
      move_proid,
    })
    if (res.state) {
      const progress = await moveGetProgress(move_proid)
      if (progress === 100) {
        toast.success('移动成功')
        return Promise.resolve(true)
      }
    }
    else {
      await dialog.alert({
        title: '提示',
        content: res.error,
      })
    }

    return Promise.resolve(false)
  }

  /** 移动批量 */
  async function moveBatch(defaultPid: string, items: WebApi.Entity.FilesItem[]): Promise<boolean> {
    const pid = await moveDialog(defaultPid)
    if (!pid) {
      return Promise.resolve(false)
    }
    return await moveCore(pid, items)
  }

  /** 拖拽移动 */
  async function dragMove(cid: string, originItems: WebApi.Entity.FilesItem[]) {
    return await moveCore(cid, originItems)
  }

  /** 提到上级 */
  async function improve(items: WebApi.Entity.FilesItem[], prevLevelId: string): Promise<boolean> {
    const dialogRes = await dialog.confirm({
      title: '提到上级',
      content: '将文件提升到上级目录，确定提升吗？',
    })
    if (!dialogRes) {
      return Promise.resolve(false)
    }

    const moveRes = await moveCore(prevLevelId, items)
    if (moveRes) {
      toast.success('提到上级成功')
    }

    return Promise.resolve(false)
  }

  return {
    moveDialog,
    moveBatch,
    dragMove,
    improve,
  }
}
