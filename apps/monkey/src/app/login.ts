import type { LocationQueryValue } from 'vue-router'
import { router } from '@/app/router'

export const DEFAULT_LOGIN_REASON = '登录 115 后即可继续使用 MasterApp。'

let navigating = false

/** 只允许站内绝对路径作为登录后的回跳地址。 */
export function resolveLoginRedirect(value: LocationQueryValue | LocationQueryValue[]) {
  const target = Array.isArray(value) ? value[0] : value

  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/login'))
    return '/'
  return target
}

/** 并发会话失效收敛到同一个登录路由，并保留登录后的回跳位置。 */
export async function showLogin(message = '登录状态已失效，请重新登录后继续使用。') {
  const current = router.currentRoute.value

  if (current.name === 'login' || navigating)
    return

  navigating = true
  try {
    await router.replace({
      name: 'login',
      query: {
        reason: message,
        redirect: current.fullPath,
      },
    })
  }
  finally {
    navigating = false
  }
}
