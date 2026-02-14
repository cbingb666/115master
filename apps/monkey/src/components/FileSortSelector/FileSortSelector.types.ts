import type { WebApi } from '@115master/drive115'

export interface Sort {
  name?: string
  order: WebApi.Entity.Sorter['o']
  asc: WebApi.Entity.Sorter['asc']
  icon?: string
}
