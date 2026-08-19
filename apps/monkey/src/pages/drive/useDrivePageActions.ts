import type { Share } from '@115master/drive115'
import type { useDriveAction } from '@/hooks/useDriveAction'
import type { useDriveStore } from '@/store/driveList'
import type { Action } from '@/types/action'
import { computed } from 'vue'
import { I } from '@/icons'

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

  async function dragMove(cid: string, items: Share.Entity.FilesItem[]) {
    const success = await action.dragMove(cid, items)
    if (success)
      await store.afterAction()
    return success
  }

  const atoms = {
    top: {
      name: 'top',
      label: '置顶',
      activeLabel: '取消置顶',
      icon: I.TOP,
      activeIcon: I.TOP_SOLID,
      activeIconColor: 'text-primary',
      active: computed(() => store.selection.values.some(item => item.is_top)),
      onClick: top,
    },
    star: {
      name: 'star',
      label: '星标',
      activeLabel: '取消星标',
      icon: I.STAR,
      activeIcon: I.STAR_FILL,
      activeIconColor: 'text-primary',
      active: computed(() => store.selection.values.some(item => item.m)),
      onClick: star,
    },
    move: {
      name: 'move',
      label: '移动',
      icon: I.MOVE,
      onClick: move,
    },
    improve: {
      name: 'improve',
      label: '提到上级',
      icon: I.FILE_IMPROVE,
      show: computed(() => store.prevLevel !== undefined),
      onClick: improve,
    },
    rename: {
      name: 'rename',
      label: '重命名',
      icon: I.RENAME,
      show: computed(() => store.selection.count === 1),
      onClick: rename,
    },
    tag: {
      name: 'tag',
      label: '打标签',
      icon: I.TAG,
      onClick: tag,
    },
    delete: {
      name: 'delete',
      icon: I.DELETE,
      label: '删除',
      onClick: remove,
    },
  } satisfies Record<string, Action>

  const groups: Action[][] = [
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
