import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'
import { drive115 } from '@/utils/drive115Instance'

/** 用户账户信息 Store */
export const useUserAqStore = defineStore('userAq', () => {
  return useAsyncState(async () => {
    const res = await drive115.MyApiGetUserAq()
    if (!res.state) {
      throw new Error(res.error)
    }
    return res
  }, null, {
    immediate: true,
  })
})
