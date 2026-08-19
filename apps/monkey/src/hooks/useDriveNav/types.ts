import type { Ref } from 'vue'

export interface NavSource {
  cid: Readonly<Ref<string>>
  area: Readonly<Ref<string>>
}
