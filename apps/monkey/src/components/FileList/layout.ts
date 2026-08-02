import type { Share } from '@115master/drive115'
import { getFilesItemId } from '@/utils/filesItem'

export function group(items: readonly Share.Entity.FilesItem[], columns: number) {
  return Array.from(
    { length: Math.ceil(items.length / columns) },
    (_, index) => items.slice(index * columns, (index + 1) * columns),
  )
}

export function locate(items: readonly Share.Entity.FilesItem[], id: string, columns: number) {
  const index = items.findIndex(item => getFilesItemId(item) === id)
  return index < 0 ? -1 : Math.floor(index / columns)
}
