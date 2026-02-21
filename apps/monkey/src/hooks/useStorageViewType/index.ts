import { useStorage } from '@vueuse/core'

export function useStorageViewType() {
  return useStorage<'list' | 'card'>('115Master_viewType', 'list')
}
