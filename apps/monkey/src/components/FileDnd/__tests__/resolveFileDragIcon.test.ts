import type { Share } from '@115master/drive115'
import { describe, expect, it } from 'vitest'
import { resolveFileDragIcon } from '../resolveFileDragIcon'

function item(partial: Partial<Share.Entity.FilesItem>) {
  return partial as Share.Entity.FilesItem
}

describe('resolveFileDragIcon', () => {
  it('解析文件夹图标', () => {
    expect(resolveFileDragIcon(item({ fc: 0, iv: 0, ico: 'folder' }))).toBe('custom:folder')
  })

  it('解析视频图标', () => {
    expect(resolveFileDragIcon(item({ fc: 1, iv: 1, ico: 'mp4' }))).toBe('ion:film')
  })

  it('解析图片图标', () => {
    expect(resolveFileDragIcon(item({ fc: 1, iv: 0, ico: 'jpg' }))).toBe('custom:image-file')
  })

  it('解析音频图标', () => {
    expect(resolveFileDragIcon(item({ fc: 1, iv: 0, ico: 'flac' }))).toBe('ion:musical-note')
  })

  it('其他类型使用通用文档图标', () => {
    expect(resolveFileDragIcon(item({ fc: 1, iv: 0, ico: 'zip' }))).toBe('ion:document-text-outline')
  })
})
