import type { FileTagInput } from '../fileTag'
import { describe, expect, it } from 'vitest'
import { intersectTagIds, resolveFileTagChanges } from '../fileTag'

/** 工具：把变更结果转为 `fileId -> labelIds(集合)` 便于无视顺序断言 */
function toMap(changes: ReturnType<typeof resolveFileTagChanges>) {
  return new Map(changes.map(c => [c.fileId, new Set(c.labelIds)]))
}

describe('intersectTagIds', () => {
  it('空数组返回空集', () => {
    expect(intersectTagIds([])).toEqual(new Set())
  })

  it('单文件即其全部标签', () => {
    const files: FileTagInput[] = [{ id: 'f1', tagIds: ['a', 'b'] }]
    expect(intersectTagIds(files)).toEqual(new Set(['a', 'b']))
  })

  it('多文件取交集', () => {
    const files: FileTagInput[] = [
      { id: 'f1', tagIds: ['a', 'b'] },
      { id: 'f2', tagIds: ['a', 'c'] },
    ]
    expect(intersectTagIds(files)).toEqual(new Set(['a']))
  })

  it('任一文件无标签则交集为空', () => {
    const files: FileTagInput[] = [
      { id: 'f1', tagIds: ['a'] },
      { id: 'f2', tagIds: [] },
    ]
    expect(intersectTagIds(files)).toEqual(new Set())
  })
})

describe('resolveFileTagChanges', () => {
  it('单文件 final 等于其全部标签 → 无变更', () => {
    const files: FileTagInput[] = [{ id: 'f1', tagIds: ['a', 'b'] }]
    expect(resolveFileTagChanges(files, new Set(['a', 'b']))).toEqual([])
  })

  it('单文件新增一个标签', () => {
    const files: FileTagInput[] = [{ id: 'f1', tagIds: ['a', 'b'] }]
    const res = resolveFileTagChanges(files, new Set(['a', 'b', 'c']))
    expect(toMap(res).get('f1')).toEqual(new Set(['a', 'b', 'c']))
  })

  it('单文件移除一个标签', () => {
    const files: FileTagInput[] = [{ id: 'f1', tagIds: ['a', 'b'] }]
    const res = resolveFileTagChanges(files, new Set(['a']))
    expect(toMap(res).get('f1')).toEqual(new Set(['a']))
  })

  it('批量：final 全新增 → 每文件在各自 fl 基础上并上新增', () => {
    const files: FileTagInput[] = [
      { id: 'f1', tagIds: ['a', 'b'] },
      { id: 'f2', tagIds: ['a', 'c'] },
    ]
    const res = resolveFileTagChanges(files, new Set(['x']))
    const m = toMap(res)
    expect(m.get('f1')).toEqual(new Set(['b', 'x']))
    expect(m.get('f2')).toEqual(new Set(['c', 'x']))
  })

  it('批量：final 取消交集项 → 每文件移除该项、保留各自其他标签', () => {
    const files: FileTagInput[] = [
      { id: 'f1', tagIds: ['a', 'b'] },
      { id: 'f2', tagIds: ['a', 'c'] },
    ]
    const res = resolveFileTagChanges(files, new Set())
    const m = toMap(res)
    expect(m.get('f1')).toEqual(new Set(['b']))
    expect(m.get('f2')).toEqual(new Set(['c']))
  })

  it('fl 为空 → 当空集参与，final 全为 added', () => {
    const files: FileTagInput[] = [{ id: 'f1', tagIds: [] }]
    const res = resolveFileTagChanges(files, new Set(['x', 'y']))
    const m = toMap(res)
    expect(m.get('f1')).toEqual(new Set(['x', 'y']))
  })

  it('没有任何勾选变化 → 空变更集', () => {
    const files: FileTagInput[] = [
      { id: 'f1', tagIds: ['a', 'b'] },
      { id: 'f2', tagIds: ['a', 'b', 'c'] },
    ]
    // 交集 = {a,b}；final = 交集 → 无勾选变化
    expect(resolveFileTagChanges(files, new Set(['a', 'b']))).toEqual([])
  })

  it('与初始相同的目标被省略（部分文件无需写回）', () => {
    /** f1 已自然满足目标，f2 需写回 */
    const files: FileTagInput[] = [
      { id: 'f1', tagIds: ['a', 'x'] },
      { id: 'f2', tagIds: ['a'] },
    ]
    // 交集 = {a}；final = {a,x} → added={x}
    /** f1 已有 x → 省略；f2 加 x → 写回 */
    const res = resolveFileTagChanges(files, new Set(['a', 'x']))
    expect(res).toHaveLength(1)
    expect(res[0]!.fileId).toBe('f2')
    expect(new Set(res[0]!.labelIds)).toEqual(new Set(['a', 'x']))
  })

  it('批量新增：所有文件都加同一个标签', () => {
    const files: FileTagInput[] = [
      { id: 'f1', tagIds: ['a'] },
      { id: 'f2', tagIds: ['b'] },
      { id: 'f3', tagIds: [] },
    ]
    /** 交集为空；final = {new} → 全新增 */
    const res = resolveFileTagChanges(files, new Set(['new']))
    const m = toMap(res)
    expect(m.get('f1')).toEqual(new Set(['a', 'new']))
    expect(m.get('f2')).toEqual(new Set(['b', 'new']))
    expect(m.get('f3')).toEqual(new Set(['new']))
  })

  it('labelIds 不含重复 id', () => {
    const files: FileTagInput[] = [{ id: 'f1', tagIds: ['a', 'a', 'b'] }]
    const res = resolveFileTagChanges(files, new Set(['a', 'b', 'c']))
    const ids = res.find(c => c.fileId === 'f1')?.labelIds ?? []
    expect(new Set(ids).size).toBe(ids.length)
  })
})
