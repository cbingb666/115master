import type { Ref } from 'vue'

export interface UseDriveFileOptions {
  keyword: Ref<string>
  suffix?: Ref<string>
  type?: Ref<string>
  cid: Ref<string>
  area: Ref<string>
  page: Ref<number>
  size: Ref<number>
  nf?: Ref<string>
}
