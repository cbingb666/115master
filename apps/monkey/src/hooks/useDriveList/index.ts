import type { Api } from '@115master/drive115'
import { shallowRef } from 'vue'
import { drive115 } from '@/utils/drive115Instance'

export type ListData = Api.FileApi.Res.Files | Api.FileApi.Res.GetFilesSearch

export function useDriveList() {
  const data = shallowRef<ListData | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef<Error | null>(null)

  /** 请求版本号, 用于丢弃过期请求 */
  let generation = 0

  async function execute(params: Api.FileApi.Req.GetFiles): Promise<boolean> {
    const gen = ++generation
    loading.value = true
    error.value = null
    data.value = null
    try {
      const res = await drive115.file.getFilesWithFallback(params)
      if (!res.state)
        throw new Error(res.message)
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

  async function search(params: Api.FileApi.Req.GetFilesSearch): Promise<boolean> {
    const gen = ++generation
    loading.value = true
    error.value = null
    data.value = null
    try {
      const res = await drive115.file.searchFiles(params)
      if (!res.state)
        throw new Error(res.message)
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
