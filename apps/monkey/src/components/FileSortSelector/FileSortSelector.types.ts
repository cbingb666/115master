import type { WebApi } from '@/utils/drive115/api'

export interface Sort {
  name?: string
  order: WebApi.Entity.Sorter['o']
  asc: WebApi.Entity.Sorter['asc']
  icon?: string
}
