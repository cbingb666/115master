import type { Tag } from '@/store/tagList'
import { useMagicKeys } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useMarqueeSelect } from '@/hooks/useMarqueeSelect'

interface TagListInteractionOptions {
  /** 框选容器（<Main> 根 div，须 position 非静态） */
  container: () => HTMLElement | undefined
  /** 当前可见列表（搜索过滤后） */
  list: () => Tag[]
  isSelected: (id: string) => boolean
  toggle: (id: string, on: boolean) => void
  selectAll: () => void
  clearSelection: () => void
}

/**
 * 标签列表多选交互：拖拽框选 + 整行点击 + Shift/Meta 修饰 + ESC/Cmd+A。
 * 与 drive 的 useFileList 对应，去掉了文件特有的拖拽移动/右键/预览。
 */
export function useTagListInteraction(options: TagListInteractionOptions) {
  useMarqueeSelect({ container: options.container })

  const keys = useMagicKeys({
    onEventFired: (e) => {
      // 拦截 Cmd/Ctrl+A，避免触发浏览器原生全选；其余按键放行
      if (e.key === 'a' && (e.metaKey || e.ctrlKey))
        e.preventDefault()
    },
  })

  const lastCheckedIndex = ref(-1)

  function handleClick(tag: Tag) {
    const list = options.list()
    const currentIndex = list.findIndex(t => t.id === tag.id)
    if (currentIndex < 0)
      return

    if (keys.Shift.value && lastCheckedIndex.value !== -1) {
      const start = Math.min(lastCheckedIndex.value, currentIndex)
      const end = Math.max(lastCheckedIndex.value, currentIndex)
      for (let i = start; i <= end; i++)
        options.toggle(list[i].id, true)
    }
    else if (keys.Meta.value || keys.Control.value) {
      const was = options.isSelected(tag.id)
      options.toggle(tag.id, !was)
      if (!was)
        lastCheckedIndex.value = currentIndex
    }
    else {
      options.clearSelection()
      options.toggle(tag.id, true)
      lastCheckedIndex.value = currentIndex
    }
  }

  watch(keys.Escape, (v) => {
    if (v) {
      options.clearSelection()
      lastCheckedIndex.value = -1
    }
  })

  watch(keys['Meta+A'], (v) => {
    if (v)
      options.selectAll()
  })
  watch(keys['Ctrl+A'], (v) => {
    if (v)
      options.selectAll()
  })

  return { handleClick }
}
