import { describe, expect, it } from 'vitest'
import { SORT_OPTIONS } from '../config'

describe('file sort selector config', () => {
  it('orders options by direction for the column-flow matrix', () => {
    expect(SORT_OPTIONS.map(option => option.name)).toEqual([
      '最早创建',
      '最早修改',
      '最早打开',
      '名称 A–Z',
      '最小优先',
      '最近创建',
      '最近修改',
      '最近打开',
      '名称 Z–A',
      '最大优先',
    ])
  })

  it('assigns type and directional icons to every sort option', () => {
    expect(SORT_OPTIONS).toHaveLength(10)
    expect(SORT_OPTIONS.every(option => option.icon.startsWith('custom:sort-'))).toBe(true)
    expect(SORT_OPTIONS.every(option => option.typeIcon.startsWith('custom:sort-'))).toBe(true)
    expect(new Set(SORT_OPTIONS.map(option => option.icon)).size).toBe(10)
    expect(new Set(SORT_OPTIONS.map(option => option.typeIcon)).size).toBe(5)
    expect(SORT_OPTIONS.filter(option => option.asc === 1).map(option => option.typeIcon)).toEqual(
      SORT_OPTIONS.filter(option => option.asc === 0).map(option => option.typeIcon),
    )
  })
})
