import { Crypto115, Drive115 } from '@115master/drive115'
import { FetchRequest } from '@115master/shared'
import { showCaptcha } from '@/app/captcha'
import { showLogin } from '@/app/login'
import { appLogger } from '@/utils/logger'
import { GMRequest } from '@/utils/request/gmRequest'

const fetchRequest = new FetchRequest()
let captchaApi: Parameters<typeof showCaptcha>[0] | undefined

const instance = new Drive115({
  fetchRequest,
  proApiRequest: new GMRequest(),
  logger: appLogger,
  crypto115: new Crypto115(),
  onError(result) {
    if (result.action === 'relogin') {
      showLogin(result.message)
      return
    }
    if (result.action === 'verify' && captchaApi) {
      try {
        void showCaptcha(captchaApi)
          .catch(e => appLogger.error('[drive115] 人机验证弹窗失败:', e))
      }
      catch (e) {
        appLogger.error('[drive115] 人机验证弹窗失败:', e)
      }
    }
  },
})

captchaApi = instance.auth

export const drive115 = instance
