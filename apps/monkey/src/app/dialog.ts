import type { AppDialogService } from './dialogAdapter'
import { createDialogService, useDialog } from '@115master/ui'
import { router } from '@/app/router'
import { appLogger } from '@/utils/logger'
import { createAppDialogService } from './dialogAdapter'

export type { AppDialogCreateOptions, AppDialogService } from './dialogAdapter'
export { createAppDialogService } from './dialogAdapter'

export function useAppDialog(): AppDialogService {
  return useDialog() as AppDialogService
}

export const appDialog = createAppDialogService(
  createDialogService({
    messages: {
      confirm: '确认',
      cancel: '取消',
      inputLabel: '输入',
      requiredError: '此项为必填。',
    },
    onError: cause => appLogger.error('Dialog error:', cause),
  }),
  router,
  cause => appLogger.error('Dialog history error:', cause),
)
