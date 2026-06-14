import { expect, it } from 'vitest'
import { boundary } from './index.ts'

it('boundary', () => {
  expect(boundary(1, 0, 10)).toBe(1)
  expect(boundary(11, 0, 10)).toBe(10)
  expect(boundary(0, 1, 10)).toBe(1)
  expect(boundary(11, 1, 10)).toBe(10)
  expect(boundary(-5, -10, 10)).toBe(-5)
  expect(boundary(-15, -10, 10)).toBe(-10)
})
