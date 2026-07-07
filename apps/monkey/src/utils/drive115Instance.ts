import { Crypto115, Drive115 } from '@115master/drive115'
import { FetchRequest } from '@115master/shared'
import { appLogger } from '@/utils/logger'
import { is115Browser } from '@/utils/platform'
import { GMRequest } from '@/utils/request/gmRequest'

const fetchRequest = new FetchRequest()

export const drive115 = new Drive115({
  fetchRequest,
  proApiRequest: is115Browser ? new GMRequest() : fetchRequest,
  logger: appLogger,
  crypto115: new Crypto115(),
})
