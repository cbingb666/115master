import { describe, expect, it } from 'vitest'
import { composeRenamedName } from '../helpers'

describe('composeRenamedName', () => {
  it('文件夹（无扩展名）→ 直接采用输入', () => {
    expect(composeRenamedName('我的文件夹', '新名字')).toBe('新名字')
  })

  it('文件 → 拼回原扩展名（与 115 服务端保留扩展名行为一致）', () => {
    expect(composeRenamedName('video.mp4', 'video2')).toBe('video2.mp4')
  })

  it('输入未改主体 → 还原为原文件名', () => {
    expect(composeRenamedName('a.txt', 'a')).toBe('a.txt')
  })

  it('多段扩展名 → 与 removeFileExtension 对称，拼回最后一段', () => {
    expect(composeRenamedName('archive.tar.gz', 'archive2')).toBe('archive2.gz')
  })
})
