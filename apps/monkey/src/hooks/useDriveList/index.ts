import type { WebApi } from '@115master/drive115'
import { shallowRef } from 'vue'
import { drive115 } from '@/utils/drive115Instance'

export type ListData = WebApi.Res.Files | WebApi.Res.GetFilesSearch

export function useDriveList() {
  const data = shallowRef<ListData | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef<Error | null>(null)

  /** 请求版本号, 用于丢弃过期请求 */
  let generation = 0

  async function execute(params: WebApi.Req.GetFiles): Promise<boolean> {
    const gen = ++generation
    loading.value = true
    error.value = null
    try {
      let res = await drive115.webApiGetFiles(params)
      if (!res.state) {
        // 默认接口错误时使用 aps 接口
        params.o = res.order
        params.asc = res.is_asc
        res = await drive115.ApsGetNatsortFiles(params)
        if (!res.state)
          throw new Error(res.error)
      }
      if (gen !== generation)
        return false
      data.value = res
      return true
    }
    catch (e) {
      if (gen !== generation)
        return false
      error.value = e instanceof Error ? e : new Error(String(e))
      return false
    }
    finally {
      if (gen === generation)
        loading.value = false
    }
  }

  async function search(params: WebApi.Req.GetFilesSearch): Promise<boolean> {
    const gen = ++generation
    loading.value = true
    error.value = null
    try {
      const res = await drive115.webApiGetFilesSearch(params)
      if (!res.state)
        throw new Error(res.error)
      if (gen !== generation)
        return false
      data.value = res
      return true
    }
    catch (e) {
      if (gen !== generation)
        return false
      error.value = e instanceof Error ? e : new Error(String(e))
      return false
    }
    finally {
      if (gen === generation)
        loading.value = false
    }
  }

  /** 同步设置数据 (缓存加载用) */
  function set(res: ListData) {
    generation++
    data.value = res
    loading.value = false
    error.value = null
  }

  /** 使进行中请求过期 */
  function cancel() {
    generation++
  }

  return {
    data,
    loading,
    error,
    execute,
    search,
    set,
    cancel,
  }
}

export type UseDriveListReturn = ReturnType<typeof useDriveList>
