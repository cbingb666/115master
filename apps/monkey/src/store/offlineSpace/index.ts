import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'
import { drive115 } from '@/utils/drive115'

/** 离线空间 Store */
export const useOfflineSpaceStore = defineStore('offlineSpace', () => {
  return useAsyncState(async () => {
    const res = await drive115.NormalApiGetOfflineSpace()
    return res
  }, null, {
    immediate: true,
  })
})
