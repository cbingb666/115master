import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'
import { drive115 } from '@/utils/drive115Instance'

/** 离线配额 Store */
export const useOfflineQuotaPackageInfoStore = defineStore('offlineQuotaPackageInfo', () => {
  return useAsyncState(async () => {
    const res = await drive115.NormalApiGetOfflineGetQuotaPackageInfo()
    return res
  }, null, {
    immediate: true,
  })
})
