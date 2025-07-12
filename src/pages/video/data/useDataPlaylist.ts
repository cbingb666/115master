import type { PlaylistItem } from '../../../utils/drive115/api/entity'
import { useAsyncState } from '@vueuse/core'
import { reactive } from 'vue'
import { drive115 } from '../../../utils/drive115'

/**
 * 播放列表
 */
export function useDataPlaylist() {
  const playlist = useAsyncState(
    async (cid: string) => {
      const res = await drive115.getPlaylist(cid)
      return res
    },
    null,
    {
      immediate: false,
    },
  )

  /** 更新播放列表项 */
  const updateItem = (pickCode: string, data: Partial<PlaylistItem>) => {
    if (!playlist.state.value)
      return
    const index = playlist.state.value.data.findIndex(i => i.pc === pickCode)
    if (index !== -1) {
      playlist.state.value.data[index] = {
        ...playlist.state.value.data[index],
        ...data,
      }
    }
  }

  /** 更新播放列表项时间 */
  const updateItemTime = (pickCode: string, time: number) => {
    updateItem(pickCode, { current_time: time })
  }

  /** 更新播放列表项星标 */
  const updateItemMark = (pickCode: string, mark: boolean) => {
    updateItem(pickCode, { m: mark ? 1 : 0 })
  }

  return reactive({
    ...playlist,
    updateItemTime,
    updateItemMark,
  })
}
