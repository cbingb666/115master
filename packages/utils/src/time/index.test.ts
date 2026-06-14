import { expect, it } from 'vitest'
import { blurTime, getDuration } from './index.ts'

it('blurTime', () => {
  expect(blurTime(10, 5, 20)).toBe(12.5)
  expect(blurTime(25, 10, 20)).toBe(20)
  expect(blurTime(-5, 10, 20)).toBe(5)
})

it('getDuration', () => {
  expect(getDuration('10:00')).toBe(600)
  expect(getDuration('01:00:00')).toBe(3600)
  expect(getDuration('00:01:00')).toBe(60)
  expect(getDuration('00:00:01')).toBe(1)
  expect(getDuration(undefined)).toBe(0)
})
