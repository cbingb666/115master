import type { useDataFileInfo } from './useDataFileInfo'
import { shallowRef, watch } from 'vue'
import { drive115 } from '../../../utils/drive115'
import { MarkStatus } from '../../../utils/drive115/api/webApi/req'

/** 收藏 */
export function useMark(DataFileInfo: ReturnType<typeof useDataFileInfo>) {
  const isMark = shallowRef<boolean | null>(null)

  /** 切换收藏状态 */
  const toggleMark = async () => {
    const res = await drive115.webApiPostFilesStar({
      file_id: DataFileInfo.state.file_id,
      star: isMark.value ? MarkStatus.Unmark : MarkStatus.Mark,
    })
    if (res.state) {
      isMark.value = !isMark.value
    }
  }

  // 同步文件收藏状态
  watch(
    () => DataFileInfo.state.is_mark,
    (newVal) => {
      isMark.value = newVal !== undefined ? newVal === MarkStatus.Mark : null
    },
  )

  return {
    toggleMark,
    isMark,
  }
}
