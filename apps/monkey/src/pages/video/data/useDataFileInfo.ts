import type { Api } from '@115master/drive115'
import { useAsyncState } from '@vueuse/core'
import { reactive } from 'vue'
import { drive115 } from '@/utils/drive115Instance'

/** 文件信息 */
export function useDataFileInfo() {
  const fileInfo = useAsyncState(
    async (pickCode: string) => {
      const response = await drive115.video.getFilesVideo({
        pickcode: pickCode,
        share_id: '0',
        local: '1',
      })
      return response
    },
    {} as Api.VideoApi.Res.FilesVideo,
    {
      immediate: false,
    },
  )

  return reactive(fileInfo)
}
