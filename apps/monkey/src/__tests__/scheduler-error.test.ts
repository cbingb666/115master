import { describe, expect, it } from 'vitest'
import { SchedulerError } from '../utils/scheduler'

describe('schedulerError', () => {
  it('taskExist is instance of SchedulerError', () => {
    expect(new SchedulerError.TaskExist()).toBeInstanceOf(SchedulerError)
  })

  it('taskCancelled is instance of SchedulerError', () => {
    expect(new SchedulerError.TaskCancelled()).toBeInstanceOf(SchedulerError)
  })

  it('queueFull is instance of SchedulerError', () => {
    expect(new SchedulerError.QueueFull()).toBeInstanceOf(SchedulerError)
  })

  it('queueCleared is instance of SchedulerError', () => {
    expect(new SchedulerError.QueueCleared()).toBeInstanceOf(SchedulerError)
  })

  it('taskTimeout is instance of SchedulerError', () => {
    expect(new SchedulerError.TaskTimeout()).toBeInstanceOf(SchedulerError)
  })

  it('all SchedulerErrors are also instance of Error', () => {
    expect(new SchedulerError.TaskExist()).toBeInstanceOf(Error)
    expect(new SchedulerError.QueueFull()).toBeInstanceOf(Error)
    expect(new SchedulerError.TaskTimeout()).toBeInstanceOf(Error)
  })

  it('catch block matches instanceof SchedulerError', () => {
    try {
      throw new SchedulerError.TaskExist()
    }
    catch (e) {
      expect(e instanceof SchedulerError).toBe(true)
      expect(e instanceof Error).toBe(true)
    }
  })
})
