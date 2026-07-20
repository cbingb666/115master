import { h } from 'vue'
import { useDialog } from '@/components/Dialog'
import { I, Icon } from '@/icons'
import PreferencesContent from './PreferencesContent'

export function usePreferencesDialog() {
  const dialog = useDialog()

  return () => {
    const instance = dialog.create({
      title: '偏好设置',
      content: () => h(PreferencesContent),
      showConfirm: false,
      showCancel: false,
      maskClosable: true,
      size: 'lg',
      className: 'sm:min-h-96',
      classNameContent: 'flex-none! min-h-0 overflow-hidden',
      titleActions: () => h(
        'button',
        {
          'type': 'button',
          'class': 'text-base-content/50 hover:text-base-content flex cursor-pointer items-center justify-center rounded-lg p-1 transition-colors',
          'title': '关闭',
          'aria-label': '关闭',
          'onClick': () => instance.hide(),
        },
        h(Icon, { name: I.CLOSE, class: 'text-lg' }),
      ),
    })
    return instance
  }
}
