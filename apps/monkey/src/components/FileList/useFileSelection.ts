import type { Share } from '@115master/drive115'
import { useCollectionSelection } from '@115master/ui'
import { computed } from 'vue'
import { getFilesItemId } from '@/utils/filesItem'

export interface FileSelectionOptions {
  items: Share.Entity.FilesItem[]
  selected: Set<Share.Entity.FilesItem>
  set: (item: Share.Entity.FilesItem, selected: boolean) => void
  clear: () => void
  container: () => HTMLElement | undefined
  onActivate: (item: Share.Entity.FilesItem) => void
  onDragMove?: (cid: string, items: Share.Entity.FilesItem[]) => void
}

export function useFileSelection(options: FileSelectionOptions) {
  const selection = useCollectionSelection<Share.Entity.FilesItem>({
    items: () => options.items,
    key: getFilesItemId,
    selection: {
      has: item => options.selected.has(item),
      set: options.set,
      clear: options.clear,
      size: () => options.selected.size,
    },
    container: options.container,
    onActivate: options.onActivate,
  })

  const contextmenuShow = computed({
    get: () => selection.menu.value !== null,
    set: (show) => {
      if (!show)
        selection.closeMenu()
    },
  })
  const contextmenuPosition = computed(() => selection.menu.value ?? { x: 0, y: 0 })

  const dragPayload = (item: Share.Entity.FilesItem) => () => {
    if (!options.selected.has(item))
      selection.set(item, true)
    return options.selected.size > 0 ? Array.from(options.selected) : [item]
  }

  const itemProps = (item: Share.Entity.FilesItem, dragging: boolean) => ({
    ...selection.itemProps(item),
    checked: options.selected.has(item),
    data: item,
    dragging: dragging && options.selected.has(item),
    pathSelect: false,
    onChecked: (checked: boolean) => selection.set(item, checked),
    dragPayload: dragPayload(item),
    onDragMove: (cid: string, items: Share.Entity.FilesItem[]) => options.onDragMove?.(cid, items),
  })

  return {
    selectMode: selection.active,
    allSelected: selection.allSelected,
    exitSelectMode: selection.clear,
    selectAll: selection.selectAll,
    contextmenuShow,
    contextmenuPosition,
    itemProps,
  }
}
