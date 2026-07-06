import { expect, it } from 'vitest'
import { srtToVtt } from './index.ts'

it('srtToVtt', () => {
  expect(srtToVtt(`1
00:00:01,000 --> 00:00:04,000
Hello world`)).toBe(`WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world\n\n`)

  expect(srtToVtt(`not-a-timecode
00:00:01,000 --> 00:00:04,000
Hello world`)).toBe(`WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world\n\n`)

  expect(srtToVtt(`1
No timecode here
Hello world`)).toBe(`WEBVTT\n\n`)
})
