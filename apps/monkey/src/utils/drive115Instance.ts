import { Crypto115, Drive115 } from '@115master/drive115'
import { FetchRequest } from '@115master/shared'
import { appLogger } from '@/utils/logger'
import { GMRequest } from '@/utils/request/gmRequest'

const fetchRequest = new FetchRequest()

export const drive115 = new Drive115({
  fetchRequest,
  proApiRequest: new GMRequest(),
  logger: appLogger,
  crypto115: new Crypto115(),
  onError(result) {
    if (result.action === 'relogin') {
      // TODO: 触发重新登录流程
      alert('登录状态已过期，请重新登录')
    }
    if (result.action === 'verify') {
      // TODO: 触发人机验证流程
      alert('请完成验证')
    }
  },
})
