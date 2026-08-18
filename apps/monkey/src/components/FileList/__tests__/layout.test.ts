import type { Share } from '@115master/drive115'
import { describe, expect, it } from 'vitest'
import { group } from '../layout'

function item(id: string): Share.Entity.FilesItem {
  return { fc: 1, fid: id } as Share.Entity.FilesItem
}

describe('fileList layout', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map(item)

  it('按视觉列数分行并保留行序', () => {
    expect(group(items, 2)).toEqual([
      [items[0], items[1]],
      [items[2], items[3]],
      [items[4]],
    ])
    expect(group(items, 1)).toEqual(items.map(item => [item]))
  })
})
