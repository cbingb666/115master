import type { Api } from '@115master/drive115'
import { Core } from '@115master/drive115'
import { shallowRef } from 'vue'
import { drive115 } from '@/utils/drive115Instance'
import { appLogger } from '@/utils/logger'

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
        throw new Core.Drive115Error(res.message, Core.Drive115ErrorCode.Unknown)
      if (gen !== generation)
        return false
      data.value = res
      return true
    }
    catch (e) {
      if (gen !== generation)
        return false
      const err = Core.toDrive115Error(e)
      error.value = err
      appLogger.warn('文件列表加载失败', Core.toResult(err))
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
        throw new Core.Drive115Error(res.message, Core.Drive115ErrorCode.Unknown)
      if (gen !== generation)
        return false
      data.value = res
      return true
    }
    catch (e) {
      if (gen !== generation)
        return false
      const err = Core.toDrive115Error(e)
      error.value = err
      appLogger.warn('文件搜索失败', Core.toResult(err))
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
