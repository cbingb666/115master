import type { Ref } from 'vue'

export type NavigationDirection = 'forward' | 'back' | 'replace'

export interface NavSource {
  cid: Readonly<Ref<string>>
  area: Readonly<Ref<string>>
  direction: Readonly<Ref<NavigationDirection>>
}
