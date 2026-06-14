import { describe, expect, it } from 'vitest'
import * as utils from './index.ts'

describe('utils', () => {
  it('exports every utility namespace', async () => {
    expect(utils.array.intervalArray(0, 5, 1)).toEqual([0, 1, 2, 3, 4])
    expect(utils.file.getFileExtensionByUrl('https://example.com/a.mp4')).toBe('mp4')
    expect(utils.format.dateTime('')).toBe('')
    expect(utils.image.resize(2000, 1000, 1000, 500)).toEqual({ width: 1000, height: 500 })
    expect(utils.number.boundary(5, 0, 10)).toBe(5)
    await expect(utils.promise.promiseDelay(0)).resolves.toBeUndefined()
    expect(utils.string.removeFileExtension('a.txt')).toBe('a')
    expect(utils.time.getDuration('00:01')).toBe(1)
  })
})
