import dayjs from 'dayjs'
import { expect, it } from 'vitest'
import { date, dateTime, duration, fileSize, recentDateTime } from './index.ts'

it('dateTime', () => {
  const ms = dayjs('2024-01-15 09:30').valueOf()
  expect(dateTime(ms)).toBe('2024-01-15 09:30')
  expect(dateTime(Math.floor(ms / 1000))).toBe('2024-01-15 09:30')
  expect(dateTime('2024-01-15 09:30')).toBe('2024-01-15 09:30')
  expect(dateTime('')).toBe('')
  expect(dateTime('not-a-date')).toBe('')
})

it('date', () => {
  const ms = dayjs('2024-06-01').valueOf()
  expect(date(ms)).toBe('2024-06-01')
  expect(date(undefined)).toBe('')
})

it('recentDateTime', () => {
  const now = dayjs()
  expect(recentDateTime(now.valueOf())).toBe(now.format('HH:mm'))
  expect(recentDateTime(now.subtract(1, 'day').valueOf())).toBe(`昨天 ${now.subtract(1, 'day').format('HH:mm')}`)
  expect(recentDateTime(now.subtract(7, 'day').valueOf())).toBe(now.subtract(7, 'day').format('MM-DD HH:mm'))
  expect(recentDateTime(dayjs('2023-01-01 12:00').valueOf())).toBe('2023-01-01 12:00')
  expect(recentDateTime('')).toBe('')
})

it('duration', () => {
  expect(duration(150)).toBe('2小时 30分钟')
  expect(duration(45)).toBe('45分钟')
  expect(duration(0)).toBe('')
})

it('fileSize', () => {
  expect(fileSize(0)).toBe('未知')
  expect(fileSize(1024)).toBe('1.00 KB')
  expect(fileSize(1024 ** 2)).toBe('1.00 MB')
})
