import { shallowRef } from 'vue'

/**
 * 统计面板
 */
export function useStatistics() {
  /** 是否显示 */
  const visible = shallowRef(false)

  const toggleVisible = () => {
    visible.value = !visible.value
  }

  return {
    visible,
    toggleVisible,
  }
}
