import type { LocationQueryValue } from 'vue-router'
import { isLoginNavigation, resolveLoginRedirect } from '@/app/login'
import { drive115 } from '@/utils/drive115Instance'

/** 仅允许未登录用户进入登录页；应用主动发起的重新登录导航直接放行。 */
export async function guardLogin(value: LocationQueryValue | LocationQueryValue[]) {
  if (isLoginNavigation())
    return true

  try {
    const user = await drive115.user.getUserAq()
    return user.state ? resolveLoginRedirect(value) : true
  }
  catch {
    return true
  }
}
