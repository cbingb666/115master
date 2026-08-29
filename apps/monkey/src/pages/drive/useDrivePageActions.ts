import type { Share } from '@115master/drive115'
import type { ActionMenuGroup, ActionMenuItem } from '@115master/ui'
import type { useDriveAction } from '@/hooks/useDriveAction'
import type { useDriveStore } from '@/store/driveList'
import { computed } from 'vue'
import { I } from '@/icons'
import { actionIcon } from '@/utils/action'

type DriveAction = ReturnType<typeof useDriveAction>
type DriveStore = ReturnType<typeof useDriveStore>

/** Drive 页面操作：绑定当前目录与选择态，并统一处理操作后的列表刷新。 */
export function useDrivePageActions(store: DriveStore, action: DriveAction) {
  async function newFolder() {
    if (await action.newFolder(store.nav.cid))
      store.afterAction()
  }

  async function top() {
    if (await action.topBatch(store.selection.values))
      store.afterAction()
  }

  async function star() {
    if (await action.starBatch(store.selection.values))
      store.afterAction()
  }

  async function move() {
    const res = await action.moveBatch(store.nav.cid, store.selection.values)
    if (res.success)
      await store.afterAction()
  }

  async function improve() {
    if (await action.improve(store.selection.values, store.prevLevel?.cid ?? '0'))
      await store.afterAction()
  }

  async function rename() {
    if (await action.renameItem(store.selection.values[0]))
      store.afterAction()
  }

  async function remove() {
    if (await action.deleteBatch(store.nav.cid, store.selection.values))
      store.afterAction()
  }

  async function cloudDownload(defaultUrls = '') {
    if (await action.cloudDownload(store.nav.cid, store.path, defaultUrls))
      store.afterAction()
  }

  async function tag() {
    await action.tagBatch(store.selection.values)
  }

  async function dragMove(cid: string, items: Share.Entity.FilesItem[], onConfirm?: () => void) {
    const success = await action.dragMove(cid, items, onConfirm)
    if (success)
      await store.afterAction()
    return success
  }

  const topActive = computed(() => store.selection.values.some(item => item.is_top))
  const starActive = computed(() => store.selection.values.some(item => item.m))
  const atoms = {
    top: {
      id: 'top',
      label: () => topActive.value ? '取消置顶' : '置顶',
      leading: actionIcon(() => topActive.value ? I.TOP_SOLID : I.TOP),
      tone: () => topActive.value ? 'primary' : 'default',
      onSelect: top,
    },
    star: {
      id: 'star',
      label: () => starActive.value ? '取消星标' : '星标',
      leading: actionIcon(() => starActive.value ? I.STAR_FILL : I.STAR),
      tone: () => starActive.value ? 'primary' : 'default',
      onSelect: star,
    },
    move: {
      id: 'move',
      label: '移动',
      leading: actionIcon(I.MOVE),
      onSelect: move,
    },
    improve: {
      id: 'improve',
      label: '提到上级',
      leading: actionIcon(I.FILE_IMPROVE),
      visible: computed(() => store.prevLevel !== undefined),
      onSelect: improve,
    },
    rename: {
      id: 'rename',
      label: '重命名',
      leading: actionIcon(I.RENAME),
      visible: computed(() => store.selection.count === 1),
      onSelect: rename,
    },
    tag: {
      id: 'tag',
      label: '打标签',
      leading: actionIcon(I.TAG),
      onSelect: tag,
    },
    delete: {
      id: 'delete',
      label: '删除',
      leading: actionIcon(I.DELETE),
      onSelect: remove,
    },
  } satisfies Record<string, ActionMenuItem>

  const groups: ActionMenuGroup[] = [
    [atoms.top, atoms.star, atoms.tag],
    [atoms.move, atoms.improve, atoms.rename],
    [atoms.delete],
  ]

  return {
    groups,
    newFolder,
    cloudDownload,
    dragMove,
  }
}
