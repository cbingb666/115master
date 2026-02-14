import type { Ref } from 'vue'
import { useAsyncState, watchDebounced } from '@vueuse/core'
import { drive115 } from '@/utils/drive115Instance'

interface UseRelatedWordsOptions {
  keyword: Ref<string>
}

export function useRelatedWords(options: UseRelatedWordsOptions) {
  const asyncData = useAsyncState(getRelatedWords, null, {
    immediate: true,
  })

  function getRelatedWords() {
    return drive115.webApiGetFilesSearch({
      search_value: options.keyword.value,
      aid: 0,
      cid: '0',
      offset: 0,
      limit: 10,
    })
  }

  watchDebounced(
    options.keyword,
    (value) => {
      if (value) {
        asyncData.execute()
      }
    },
    {
      debounce: 300,
    },
  )

  return {
    ...asyncData,
  }
}
