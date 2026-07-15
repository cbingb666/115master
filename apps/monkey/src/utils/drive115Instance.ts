import { Crypto115, Drive115 } from '@115master/drive115'
import { FetchRequest } from '@115master/shared'
import { useDialog } from '@/components/Dialog'
import { appLogger } from '@/utils/logger'
import { GMRequest } from '@/utils/request/gmRequest'

const fetchRequest = new FetchRequest()

/** 115 登录入口；登录成功后用户自行返回本页刷新 */
const LOGIN_URL = 'https://115.com/'

/** 登录过期/人机验证会被并发请求重复触发，用会话级标记收敛为只提醒一次 */
let reloginNotified = false
let verifyNotified = false

export const drive115 = new Drive115({
  fetchRequest,
  proApiRequest: new GMRequest(),
  logger: appLogger,
  crypto115: new Crypto115(),
  onError(result) {
    if (result.action === 'relogin' && !reloginNotified) {
      reloginNotified = true
      try {
        useDialog().create({
          title: '登录状态已过期',
          content: '请重新登录 115 账号后，返回本页刷新即可继续使用。',
          confirmText: '去登录',
          cancelText: '稍后',
          showCancel: true,
          maskClosable: true,
          confirmCallback: () => {
            location.href = LOGIN_URL
          },
        })
      }
      catch (e) {
        appLogger.error('[drive115] 重新登录提醒失败:', e)
      }
      return
    }
    if (result.action === 'verify' && !verifyNotified) {
      verifyNotified = true
      try {
        useDialog().alert({
          title: '需要人机验证',
          content: result.message,
        })
      }
      catch (e) {
        appLogger.error('[drive115] 人机验证提醒失败:', e)
      }
    }
  },
})
