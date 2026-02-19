import type { WebApi } from '@115master/drive115'
import { computed, shallowRef, triggerRef } from 'vue'

export function useDriveSelection() {
  const checked = shallowRef<Set<WebApi.Entity.FilesItem>>(new Set())
  const values = computed(() => Array.from(checked.value))
  const count = computed(() => checked.value.size)

  function toggle(item: WebApi.Entity.FilesItem, on: boolean) {
    if (on)
      checked.value.add(item)
    else
      checked.value.delete(item)
    triggerRef(checked)
  }

  function radio(item: WebApi.Entity.FilesItem) {
    checked.value = new Set([item])
  }

  function clear() {
    checked.value = new Set()
  }

  function has(item: WebApi.Entity.FilesItem) {
    return checked.value.has(item)
  }

  return {
    checked,
    values,
    count,
    toggle,
    radio,
    clear,
    has,
  }
}

export type UseDriveSelectionReturn = ReturnType<typeof useDriveSelection>
