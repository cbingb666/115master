import type { Ref } from 'vue'
import { inject, provide, shallowRef, toRef } from 'vue'

const FileListContext = Symbol('FileListContext')

interface FileListContextType {
  contextmenuShow: Ref<boolean>
  contextmenuPosition: Ref<{ x: number, y: number }>
  viewType: Ref<'list' | 'card'>
}

export function useFileListProvide(props: { viewType: 'list' | 'card' }) {
  const viewType = toRef(props, 'viewType')
  const contextmenuShow = shallowRef(false)
  const contextmenuPosition = shallowRef<
    FileListContextType['contextmenuPosition']['value']
  >(
    {
      x: 0,
      y: 0,
    },
  )

  const provideContext: FileListContextType = {
    viewType,
    contextmenuShow,
    contextmenuPosition,
  }

  provide(FileListContext, provideContext)
  return provideContext
}

export function useFileListInject() {
  return inject<FileListContextType>(FileListContext)
}
