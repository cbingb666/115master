import type { WebApi } from '@/utils/drive115/api'
import { useAsyncState } from '@vueuse/core'
import { reactive } from 'vue'
import { drive115 } from '@/utils/drive115'

/** 文件信息 */
export function useDataFileInfo() {
  const fileInfo = useAsyncState(
    async (pickCode: string) => {
      const response = await drive115.webApiGetFilesVideo({
        pickcode: pickCode,
        share_id: '0',
        local: '1',
      })
      return response
    },
    {} as WebApi.Res.FilesVideo,
    {
      immediate: false,
    },
  )

  return reactive(fileInfo)
}
