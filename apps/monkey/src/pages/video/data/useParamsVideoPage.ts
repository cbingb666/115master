import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 视频页面参数
 */
export function useParamsVideoPage() {
  const route = useRoute('video')

  const pickCode = computed(() => route.params.pickCode)
  /** cid 从文件信息中获取，不再从路由参数中读取 */
  const cid = ref<string>()

  return {
    cid,
    pickCode,
  }
}
