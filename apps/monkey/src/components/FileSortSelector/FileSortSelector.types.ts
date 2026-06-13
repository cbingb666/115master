import type { Sorter } from '@115master/drive115'

export interface Sort {
  name: string
  order: Sorter['o']
  asc: Sorter['asc']
  icon: string
}
