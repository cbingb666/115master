import { expect, it } from 'vitest'
import { promiseDelay, promiseWithTimeout } from './index.ts'

it('promiseDelay', async () => {
  const start = Date.now()
  await promiseDelay(50)
  expect(Date.now() - start).toBeGreaterThanOrEqual(45)
})

it('promiseWithTimeout resolves when fn is fast', async () => {
  const result = await promiseWithTimeout(() => Promise.resolve('ok'), 100)
  expect(result).toBe('ok')
})

it('promiseWithTimeout rejects when fn is slow', async () => {
  await expect(promiseWithTimeout(() => promiseDelay(200), 50)).rejects.toThrow('Timeout')
})
