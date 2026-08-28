import type { MaybeRefOrGetter } from 'vue'
import type { IconValue } from '@/icons'
import { h, toValue } from 'vue'
import { Icon } from '@/icons'

export function actionIcon(name: MaybeRefOrGetter<IconValue>) {
  return () => h(Icon, {
    name: toValue(name),
    size: 'custom',
  })
}
