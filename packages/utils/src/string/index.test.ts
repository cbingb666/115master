import { expect, it } from 'vitest'
import { extractEmojis, removeFileExtension, splitWords } from './index.ts'

it('removeFileExtension', () => {
  expect(removeFileExtension('example.txt')).toBe('example')
  expect(removeFileExtension('archive.tar.gz')).toBe('archive.tar')
  expect(removeFileExtension('no-extension')).toBe('no-extension')
})

it('splitWords', () => {
  expect(splitWords('hello world')).toEqual(['hello', 'world'])
  expect(splitWords('a,b')).toEqual(['a', ',', 'b'])
  expect(splitWords('  ')).toEqual([])
})

it('extractEmojis', () => {
  expect(extractEmojis('hello 🎉 world 👍')).toEqual(['🎉', '👍'])
  expect(extractEmojis('no emoji')).toEqual([])
})
