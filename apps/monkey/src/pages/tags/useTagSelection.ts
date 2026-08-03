import type { useTagStore } from '@/store/tagList'
import { computed } from 'vue'
import { useCollectionSelection } from '@/hooks/useCollectionSelection'

export function useTagSelection(store: ReturnType<typeof useTagStore>, container: () => HTMLElement | undefined) {
  const selection = useCollectionSelection({
    items: () => store.filtered,
    key: tag => tag.id,
    selection: {
      has: tag => store.isSelected(tag.id),
      set: (tag, selected) => store.toggle(tag.id, selected),
      clear: store.clearSelection,
      size: () => store.selectedCount,
    },
    container,
    onActivate: tag => store.toggle(tag.id, true),
  })

  const contextmenuShow = computed(() => selection.menu.value !== null)
  const contextmenuPosition = computed(() => selection.menu.value ?? { x: 0, y: 0 })

  return {
    selectMode: selection.active,
    exit: selection.clear,
    invert: selection.invert,
    selectAll: selection.selectAll,
    itemProps: selection.itemProps,
    set: selection.set,
    contextmenuShow,
    contextmenuPosition,
    closeContextmenu: selection.closeMenu,
  }
}
