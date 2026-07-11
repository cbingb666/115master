import { h } from 'vue'
import { useDialog } from '@/components/Dialog'
import PreferencesContent from './PreferencesContent'

export function usePreferencesDialog() {
  const dialog = useDialog()

  return () => {
    dialog.create({
      title: '偏好设置',
      content: () => h(PreferencesContent),
      showConfirm: false,
      showCancel: false,
      maskClosable: true,
      className: 'w-11/12! sm:w-2/3! max-w-xl',
      classNameContent: 'flex-none! min-h-0 overflow-hidden',
    })
  }
}
