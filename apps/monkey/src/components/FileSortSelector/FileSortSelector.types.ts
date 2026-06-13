import type { Entity } from '@115master/drive115'

export interface Sort {
  name: string
  order: Entity.Sorter['o']
  asc: Entity.Sorter['asc']
  icon: string
}
