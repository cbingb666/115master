import type { FilesItem } from '../../share/entity.ts'
import { describe, expect, it } from 'vitest'

describe('filesItem', () => {
  it('discriminates file by fc', () => {
    const item: FilesItem = {
      fc: 1,
      fid: '123',
      m: '0',
      n: 'file.mp4',
      ns: 'file.mp4',
      pc: 'abc',
      s: 100,
      t: 1,
      tu: 1,
      play_long: 0,
      current_time: 0,
      sha: 'sha1',
      iv: 1,
      ico: 'mp4',
      pid: '0',
      is_top: 0,
      u: '',
    }

    if (item.fc === 1) {
      expect(item.fid).toBe('123')
    }
  })

  it('discriminates folder by fc', () => {
    const item: FilesItem = {
      fc: 0,
      cid: '456',
      m: 0,
      n: 'folder',
      ns: 'folder',
      pc: '',
      s: 0,
      t: 1,
      tu: 1,
      play_long: 0,
      current_time: 0,
      sha: '',
      iv: 0,
      ico: 'folder',
      pid: '0',
      is_top: 0,
      u: '',
    }

    if (item.fc === 0) {
      expect(item.cid).toBe('456')
    }
  })
})
