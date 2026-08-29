import { describe, expect, it } from 'vitest'
import { SORT_OPTIONS } from '../config'

describe('file sort selector config', () => {
  it('orders options by direction for the column-flow matrix', () => {
    expect(SORT_OPTIONS.map(option => `${option.name}${option.asc === 1 ? '升序' : '降序'}`)).toEqual([
      '创建升序',
      '修改升序',
      '打开升序',
      '名称升序',
      '大小升序',
      '创建降序',
      '修改降序',
      '打开降序',
      '名称降序',
      '大小降序',
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
