import { expect, it } from 'vitest'
import { getFileExtensionByUrl } from './index.ts'

it('getFileExtensionByUrl', () => {
  expect(getFileExtensionByUrl('https://example.com/video.mp4')).toBe('mp4')
  expect(getFileExtensionByUrl('https://example.com/path/archive.tar.gz')).toBe('gz')
})
