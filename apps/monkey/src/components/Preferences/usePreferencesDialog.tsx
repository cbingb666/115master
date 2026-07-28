import { h } from 'vue'
import { useAppDialog } from '@/app/dialog'
import PreferencesContent from './PreferencesContent'

export function usePreferencesDialog() {
  const dialog = useAppDialog()

  return () => {
    const instance = dialog.create({
      title: '偏好设置',
      content: () => h(PreferencesContent),
      showConfirm: false,
      showCancel: true,
      cancelText: '关闭',
      closeOnBackdrop: true,
      size: 'lg',
    })
    return instance
  }
}
