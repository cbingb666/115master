import type { Base } from '@115master/drive115'

export interface Sort {
  name: string
  order: Base.Sorter['o']
  asc: Base.Sorter['asc']
  icon: string
}
