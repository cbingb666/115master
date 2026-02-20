import { useAsyncState } from '@vueuse/core'
import { JavBus, JavDB } from '@/utils/jav'
import { promiseDelay } from '@/utils/promise'

export function useDataMovieInfo() {
  const javDB = new JavDB()
  const javBus = new JavBus()

  const javDBState = useAsyncState(
    async (avNumber?: string) => {
      if (!avNumber) {
        return null
      }
      const res = await javDB.getInfo(avNumber)
      await promiseDelay(1000)
      return res
    },
    undefined,
    {
      immediate: false,
    },
  )

  const javBusState = useAsyncState(
    async (avNumber?: string) => {
      if (!avNumber) {
        return null
      }
      return javBus.getInfo(avNumber)
    },
    undefined,
    {
      immediate: false,
    },
  )

  const clear = () => {
    javBusState.state.value = null
    javDBState.state.value = null
  }

  return {
    javBusState,
    javDBState,
    clear,
  }
}
