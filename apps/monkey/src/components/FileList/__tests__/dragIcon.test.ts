import type { Share } from '@115master/drive115'
import { describe, expect, it } from 'vitest'
import { dragIcon } from '../dragIcon'

function item(partial: Partial<Share.Entity.FilesItem>) {
  return partial as Share.Entity.FilesItem
}

describe('dragIcon', () => {
  it('文件夹', () => {
    expect(dragIcon(item({ fc: 0, iv: 0, ico: 'folder' }))).toBe('custom:folder')
  })

  it('视频', () => {
    expect(dragIcon(item({ fc: 1, iv: 1, ico: 'mp4' }))).toBe('ion:film')
  })

  it('图片', () => {
    expect(dragIcon(item({ fc: 1, iv: 0, ico: 'jpg' }))).toBe('custom:image-file')
  })

  it('音频', () => {
    expect(dragIcon(item({ fc: 1, iv: 0, ico: 'flac' }))).toBe('ion:musical-note')
  })

  it('其他类型走通用文档图标', () => {
    expect(dragIcon(item({ fc: 1, iv: 0, ico: 'zip' }))).toBe('ion:document-text-outline')
  })
})
