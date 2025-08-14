import { useRouteParams, useRouteQuery } from '@vueuse/router'
import { defineStore } from 'pinia'
import { useDriveFile } from '@/hooks/useDriveFile'

export const useDriveListStore = defineStore('driveList', () => {
  const query = {
    keyword: useRouteQuery('keyword', ''),
    suffix: useRouteQuery('suffix', ''),
    type: useRouteQuery('type', ''),
    cid: useRouteParams<string>('cid'),
    area: useRouteParams<string>('area'),
    page: useRouteQuery<number>('page', 1, {
      transform: Number,
    }),
    size: useRouteQuery<number>('size', 20, {
      transform: Number,
    }),
  }
  const file = useDriveFile(query)

  return {
    ...file,
    query,
  }
})
