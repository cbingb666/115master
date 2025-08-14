import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'
import { drive115 } from '@/utils/drive115'

export const useDriveSpaceInfoStore = defineStore('driveSpaceInfo', () => {
  return useAsyncState(async () => {
    const res = await drive115.webApiGetFilesIndexInfo()
    return res
  }, null, {
    immediate: true,
  })
})
