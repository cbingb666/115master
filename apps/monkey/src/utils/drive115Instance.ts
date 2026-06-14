import { Drive115 } from '@115master/drive115'
import { fetchRequest } from '@115master/shared'
import { appLogger } from '@/utils/logger'
import { is115Browser } from '@/utils/platform'
import { GMRequest } from '@/utils/request/gmRequest'

export const drive115 = new Drive115({
  fetchRequest,
  proApiRequest: is115Browser ? new GMRequest() : fetchRequest,
  logger: appLogger,
})
