import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import { onUnmounted, shallowRef } from 'vue'
import { drive115 } from '@/utils/drive115'

/**
 * 历史记录
 */
export function useDataHistory() {
  /** 是否初始化 */
  const isinit = shallowRef(false)
  /** 文件提取码 */
  const pickcode = shallowRef('')
  /** 最后播放时间 */
  const lastTime = shallowRef(0)

  /** 保存历史记录 */
  const postHistory = async (time: number) => {
    if (!isinit.value || !pickcode.value) {
      return
    }
    drive115.webApiPostWebApiFilesHistory({
      op: 'update',
      pick_code: pickcode.value,
      share_id: '0',
      category: '1',
      definition: '0',
      time,
    })
  }

  /** 处理时间更新 */
  const handleTimeupdate = useThrottleFn(async (time: number) => {
    await postHistory(time)
  }, 5000)

  /** 处理跳转 */
  const handleSeek = useDebounceFn(async (time: number) => {
    await postHistory(time)
  }, 2000)

  /** 获取历史记录 */
  const fetch = async (_pickcode: string) => {
    pickcode.value = _pickcode
    try {
      const res = await drive115.webApiGetWebApiFilesHistory({
        fetch: 'one',
        pick_code: pickcode.value,
        share_id: '0',
        category: '1',
      })
      if (!Number.isNaN(res.data.time)) {
        lastTime.value = Number(res.data.time ?? 0)
      }
    }
    finally {
      isinit.value = true
    }
  }

  /** 清除 */
  const clear = () => {
    isinit.value = false
    pickcode.value = ''
    lastTime.value = 0
  }

  onUnmounted(() => {
    isinit.value = false
  })

  return {
    isinit,
    lastTime,
    handleTimeupdate,
    handleSeek,
    fetch,
    clear,
  }
}
