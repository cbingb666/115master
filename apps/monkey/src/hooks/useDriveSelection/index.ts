import type { Share } from '@115master/drive115'
import { computed, shallowRef, triggerRef } from 'vue'

export function useDriveSelection() {
  const checked = shallowRef<Set<Share.Entity.FilesItem>>(new Set())
  const values = computed(() => Array.from(checked.value))
  const count = computed(() => checked.value.size)

  function toggle(item: Share.Entity.FilesItem, on: boolean) {
    if (on)
      checked.value.add(item)
    else
      checked.value.delete(item)
    triggerRef(checked)
  }

  function radio(item: Share.Entity.FilesItem) {
    checked.value = new Set([item])
  }

  function selectAll(items: Share.Entity.FilesItem[]) {
    checked.value = new Set(items)
  }

  function clear() {
    checked.value = new Set()
  }

  function has(item: Share.Entity.FilesItem) {
    return checked.value.has(item)
  }

  return {
    checked,
    values,
    count,
    toggle,
    radio,
    selectAll,
    clear,
    has,
  }
}

export type UseDriveSelectionReturn = ReturnType<typeof useDriveSelection>
