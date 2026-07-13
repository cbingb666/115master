import type { Share } from '@115master/drive115'
import type { UseDialogInstance } from '@/components'
import type { TagPickerState } from '@/components/TagPicker/TagPickerContent'
import type { FileTagChange, FileTagInput } from '@/utils/fileTag'
import { Core } from '@115master/drive115'
import { reactive } from 'vue'
import { router } from '@/app/router'
import { useDialog, useToast } from '@/components'
import TagPickerContent from '@/components/TagPicker/TagPickerContent'
import { useDriveStore } from '@/store/driveList'
import { useTagStore } from '@/store/tagList'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'
import { intersectTagIds, resolveFileTagChanges } from '@/utils/fileTag'

/** 单个失败项：文件 id + 归一化错误（保留 action 用于 UI 行为分派） */
interface TagApplyFailure {
  id: string
  error: Core.Drive115Error
}

/**
 * 「打标签」文件操作。
 *
 * 在文件列表右键对选中文件（单 / 批、文件 / 文件夹）增量增删已有标签：
 * 弹窗初始勾选为选中文件标签交集，确认后客户端 diff 出每文件目标标签集，
 * 逐文件全量写回（`setFileLabels`），其余标签保留。批量用 `Promise.allSettled`
 * 聚合 + 三态 Toast；auth 类错误升级 dialog（US 14 行动指引）；失败项保留选中便于重试。
 */
export function useTagAction() {
  const dialog = useDialog()
  const toast = useToast()
  const tagStore = useTagStore()
  const drive = useDriveStore()

  /** 单文件写回；失败抛 `Drive115Error`（经 `handle()` 边界归一，保留 action 分类） */
  async function applyOne(fileId: string, labelIds: string[]) {
    const res = await drive115.tag.setFileLabels(fileId, labelIds)
    if (!res.state)
      throw new Core.Drive115Error(res.message || '打标签失败', Core.Drive115ErrorCode.Unknown)
  }

  /** 并发写回所有变更；返回失败项（成功项已生效） */
  async function applyAll(changes: FileTagChange[]): Promise<TagApplyFailure[]> {
    const results = await Promise.allSettled(
      changes.map(change => applyOne(change.fileId, change.labelIds)),
    )
    return results.flatMap((r, i) =>
      r.status === 'rejected'
        ? [{ id: changes[i]!.fileId, error: Core.toDrive115Error(r.reason) }]
        : [],
    )
  }

  /** UI 行为分派：relogin / verify 升级 dialog，其余 toast */
  async function reportError(e: unknown) {
    const err = Core.toDrive115Error(e)
    if (err.action === 'relogin' || err.action === 'verify') {
      await dialog.alert({ title: '提示', content: err.message })
      return
    }
    toast.error(err.message)
  }

  /** 三态 Toast（成功 / 部分失败含名称 / 全失败） */
  function reportBatch(total: number, failedIds: string[], nameById: Map<string, string>) {
    if (failedIds.length === 0) {
      toast.success(total === 1 ? '已应用标签' : `已应用标签（${total} 个文件）`)
      return
    }
    const successCount = total - failedIds.length
    const names = failedIds.map(id => nameById.get(id) ?? id).join('、')
    toast.error(successCount > 0 ? `${failedIds.length} 个文件打标签失败：${names}` : `打标签失败：${names}`)
  }

  /** 结果反馈：auth 类错误升级 dialog 给行动指引；否则走三态 toast */
  async function reportResult(failed: TagApplyFailure[], total: number, nameById: Map<string, string>) {
    const authError = failed.find(f => f.error.action === 'relogin' || f.error.action === 'verify')
    if (authError) {
      await dialog.alert({ title: '提示', content: authError.error.message })
      return
    }
    reportBatch(total, failed.map(f => f.id), nameById)
  }

  /** 失败项按 id 重新勾选（refresh 后引用已变，按 id 在新列表中匹配） */
  function reselectFailed(failedIds: string[]) {
    const idSet = new Set(failedIds)
    drive.list.data?.data
      ?.filter(item => idSet.has(getFilesItemId(item)))
      .forEach(item => drive.selection.toggle(item, true))
  }

  async function tagBatch(items: Share.Entity.FilesItem[]): Promise<void> {
    const files: FileTagInput[] = items.map(item => ({
      id: getFilesItemId(item),
      tagIds: (item.fl ?? []).map(t => t.id),
    }))
    const intersection = intersectTagIds(files)
    const nameById = new Map(items.map(item => [getFilesItemId(item), item.n]))

    // 标签目录：打开时若为空先 load；重置搜索词（dialog 内临时态，不进 URL）
    if (tagStore.tags.length === 0)
      await tagStore.load()
    tagStore.setKeyword('')

    const pickerState = reactive<TagPickerState>({
      checked: new Set(intersection),
      submitting: false,
    })

    /** 由 dialog.create 赋值；onConfirm 在赋值后才被调用（用户交互） */
    let instance!: UseDialogInstance

    async function onConfirm() {
      if (pickerState.submitting)
        return
      const changes = resolveFileTagChanges(files, pickerState.checked)
      if (changes.length === 0)
        return
      pickerState.submitting = true
      try {
        const failed = await applyAll(changes)
        const failedIds = failed.map(f => f.id)

        await reportResult(failed, changes.length, nameById)

        instance.hide()
        // 成功项已生效：刷新徽章；失败项按 id 重新勾选以保留重试入口。全失败则不动列表。
        if (changes.length - failedIds.length > 0) {
          await drive.refresh()
          drive.selection.clear()
          if (failedIds.length > 0)
            reselectFailed(failedIds)
        }
      }
      catch (e) {
        await reportError(e)
      }
      finally {
        pickerState.submitting = false
      }
    }

    instance = dialog.create({
      title: '打标签',
      maskClosable: true,
      history: true,
      showConfirm: false,
      showCancel: false,
      classNameActions: '!hidden',
      className: 'sm:max-w-md!',
      content: () => (
        <TagPickerContent
          state={pickerState}
          intersection={intersection}
          onConfirm={onConfirm}
          onCancel={() => instance.hide()}
          onGotoTags={() => {
            instance.hide()
            router.push('/tags')
          }}
        />
      ),
    })
  }

  return { tagBatch }
}
