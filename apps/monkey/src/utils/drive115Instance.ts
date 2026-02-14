import { GM_openInTab } from '$'
import { Drive115Wrap } from '@115master/drive115'
import { appLogger } from '@/utils/logger'
import { is115Browser } from '@/utils/platform'
import { fetchRequest } from '@/utils/request/fetchRequest'
import { GMRequest } from '@/utils/request/gmRequst'

export const drive115 = new Drive115Wrap({
  fetchRequest,
  proApiRequest: is115Browser ? new GMRequest() : fetchRequest,
  onOpenVerifyTab: (url) => {
    GM_openInTab(url, { active: true })
  },
  logger: appLogger,
})

export type { Entity } from '@115master/drive115'
