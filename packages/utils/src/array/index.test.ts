import { expect, it } from 'vitest'
import { intervalArray, jaccardSimilarity } from './index.ts'

it('intervalArray', () => {
  expect(intervalArray(0, 10, 1)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  expect(intervalArray(0, 10, 2)).toEqual([0, 2, 4, 6, 8])
  expect(intervalArray(0, 10, 3)).toEqual([0, 3, 6, 9])
  expect(intervalArray(5, 5, 1)).toEqual([])
})

it('jaccardSimilarity', () => {
  expect(jaccardSimilarity(['a', 'b'], ['b', 'c'])).toBe(1 / 3)
  expect(jaccardSimilarity(['a', 'b'], ['a', 'b'])).toBe(1)
  expect(jaccardSimilarity(['a'], ['b'])).toBe(0)
  expect(jaccardSimilarity([], [])).toBe(0)
})
