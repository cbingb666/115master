import type { Share } from '@115master/drive115'

export function group(items: readonly Share.Entity.FilesItem[], columns: number) {
  return Array.from(
    { length: Math.ceil(items.length / columns) },
    (_, index) => items.slice(index * columns, (index + 1) * columns),
  )
}
