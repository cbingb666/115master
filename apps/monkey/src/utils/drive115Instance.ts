import { Crypto115, Drive115 } from '@115master/drive115'
import { FetchRequest } from '@115master/shared'
import { appDialog } from '@/app/dialog'
import { showLogin } from '@/app/login'
import { appLogger } from '@/utils/logger'
import { GMRequest } from '@/utils/request/gmRequest'

const fetchRequest = new FetchRequest()

/** 登录过期由登录路由收敛；人机验证用会话级标记只提醒一次 */
let verifyNotified = false

export const drive115 = new Drive115({
  fetchRequest,
  proApiRequest: new GMRequest(),
  logger: appLogger,
  crypto115: new Crypto115(),
  onError(result) {
    if (result.action === 'relogin') {
      showLogin(result.message)
      return
    }
    if (result.action === 'verify' && !verifyNotified) {
      verifyNotified = true
      try {
        void appDialog.alert({
          title: '需要人机验证',
          content: result.message,
        }).catch(e => appLogger.error('[drive115] 人机验证提醒失败:', e))
      }
      catch (e) {
        appLogger.error('[drive115] 人机验证提醒失败:', e)
      }
    }
  },
})
