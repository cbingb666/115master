import type { Share } from '@115master/drive115'

export interface Sort {
  name: string
  order: Share.Base.Sorter['o']
  asc: Share.Base.Sorter['asc']
  icon: string
}
