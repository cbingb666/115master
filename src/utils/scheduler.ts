// 任务状态
export enum TaskStatus {
  // 待执行
  Pending = 'pending',
  // 执行中
  Running = 'running',
  // 暂停
  Paused = 'paused',
  // 取消
  Cancelled = 'cancelled',
  // 完成
  Completed = 'completed',
  // 失败
  Failed = 'failed',
}
interface Task<T> {
  /** 执行任务 */
  readonly execute: () => Promise<T>
  /** 任务 Promise */
  readonly promise: Promise<T>
  /** 优先级 */
  priority: number
  /** 成功回调 */
  resolve: (value: T) => void
  /** 失败回调 */
  reject: (reason: Error) => void
  /** 超时 */
  readonly timeout?: number
  /** 重试次数 */
  retries?: number
  /** 任务ID */
  readonly id: string
  /** 任务车道 */
  lane?: string
  /** 任务状态 */
  status: TaskStatus
  /** 是否立即执行 */
  readonly immediate?: boolean
  /** 任务操作 */
  readonly action?: 'push' | 'unshift'
}

interface AddTaskOptions {
  /** 优先级 */
  priority?: number
  /** 超时 */
  timeout?: number
  /** 重试次数 */
  retries?: number
  /** 车道 */
  lane?: string
  /** 任务ID */
  id?: string
  /** 是否立即执行 */
  immediate?: boolean
  /** 任务操作 */
  action?: 'push' | 'unshift'
}

export interface LaneConfig {
  /** 车道名 */
  name: string
  /** 优先级 */
  priority: number
  /** 最大并发数 */
  maxConcurrent: number
}

interface AsyncQueueOptions {
  /** 全局最大并发数 */
  maxConcurrent?: number
  /** 最大队列长度 */
  maxQueueLength?: number
  /** 默认重试延迟 */
  defaultRetryDelay?: number
  /** 任务车道配置 */
  laneConfig?: Record<string, LaneConfig>
}

type AsyncQueueOptionsDefault = Required<AsyncQueueOptions>

/**
 * 调度器错误
 */
export class SchedulerError {
  /** 任务已存在 */
  static TaskExist = class extends Error {
    constructor() {
      super('Task Exist')
    }
  }

  /** 任务已取消 */
  static TaskCancelled = class extends Error {
    constructor() {
      super('Task Cancelled')
    }
  }

  /** 队列已清空 */
  static QueueCleared = class extends Error {
    constructor() {
      super('Queue Cleared')
    }
  }

  /** 队列已满 */
  static QueueFull = class extends Error {
    constructor() {
      super('Queue Full')
    }
  }

  /** 任务超时 */
  static TaskTimeout = class extends Error {
    constructor() {
      super('Task Timeout')
    }
  }
}

/**
 * 任务调度器
 */
export class Scheduler<T> {
  /** 队列 */
  queue: Task<T>[] = []
  /** 配置选项 */
  protected options: AsyncQueueOptionsDefault = {
    maxConcurrent: 3,
    maxQueueLength: Infinity,
    defaultRetryDelay: 1000,
    laneConfig: {},
  }

  /** 正在运行的任务 */
  private running: Map<string, Task<T>> = new Map()
  /** 每个车道的运行中任务计数 */
  private laneRunningCount: Map<string, number> = new Map()

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options: AsyncQueueOptions = {}) {
    this.options = {
      ...this.options,
      ...options,
    }

    // 初始化车道运行计数
    Object.keys(this.options.laneConfig).forEach((laneName) => {
      this.laneRunningCount.set(laneName, 0)
    })
  }

  /**
   * 获取队列长度
   */
  get length() {
    return this.queue.length
  }

  /**
   * 获取正在运行的任务数
   */
  get runningCount() {
    return this.running.size
  }

  /**
   * 添加任务到队列
   */
  async add(
    execute: () => Promise<T>,
    options: AddTaskOptions = {},
  ): Promise<T> {
    if (this.queue.length >= this.options.maxQueueLength) {
      throw new SchedulerError.QueueFull()
    }

    // 是否有同名的任务
    if (options.id && this.get(options.id)) {
      throw new SchedulerError.TaskExist()
    }

    let resolve = undefined as unknown as (value: T) => void
    let reject = undefined as unknown as (reason: Error) => void
    const promise = new Promise<T>((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })

    const task: Task<T> = {
      execute,
      promise,
      priority: options.priority || 0,
      resolve,
      reject,
      timeout: options.timeout,
      retries: options.retries || 0,
      id: options.id || Math.random().toString(36).substr(2, 9),
      lane: options.lane,
      status: TaskStatus.Pending,
      immediate: options.immediate,
      action: options.action,
    }

    if (task.lane && this.isPaused(task.lane)) {
      task.status = TaskStatus.Paused
    }

    if (task.action === 'push') {
      this.queue.push(task)
    }
    else {
      this.queue.unshift(task)
    }

    this.sort()
    if (task.immediate) {
      this.processQueue()
    }

    return task.promise
  }

  /**
   * 暂停全部或指定任务或任务车道
   */
  pause(idOrLane?: string): void {
    // 暂停正在运行的任务
    this.running.forEach((task) => {
      if (!idOrLane || task.id === idOrLane || task.lane === idOrLane) {
        task.status = TaskStatus.Paused
      }
    })

    // 暂停队列中的任务
    this.queue.forEach((task) => {
      if (!idOrLane || task.id === idOrLane || task.lane === idOrLane) {
        task.status = TaskStatus.Paused
      }
    })
  }

  /**
   * 恢复全部或指定任务或任务车道
   */
  resume(idOrLane?: string): void {
    // 恢复队列中的任务
    this.queue.forEach((task) => {
      if (
        (!idOrLane || task.id === idOrLane || task.lane === idOrLane)
        && task.status === TaskStatus.Paused
      ) {
        task.status = TaskStatus.Pending
      }
    })

    this.sort()
    this.processQueue()
  }

  /**
   * 取消指定任务或任务车道
   */
  cancel(idOrLane: string): void {
    // 取消队列中的任务
    this.queue = this.queue.filter((task) => {
      if (task.id === idOrLane || task.lane === idOrLane) {
        task.status = TaskStatus.Cancelled
        task.reject(new SchedulerError.TaskCancelled())
        return false
      }
      return true
    })

    // 取消正在运行的任务
    this.running.forEach((task, taskId) => {
      if (task.id === idOrLane || task.lane === idOrLane) {
        task.status = TaskStatus.Cancelled
        task.reject(new SchedulerError.TaskCancelled())
        this.running.delete(taskId)

        // 更新车道运行计数
        if (task.lane) {
          this.decrementLaneRunningCount(task.lane)
        }
      }
    })
  }

  /**
   * 移除指定任务或任务车道
   * @param idOrLane 任务ID或车道名
   */
  remove(idOrLane: string): void {
    this.cancel(idOrLane)
    this.queue = this.queue.filter(
      task => task.id !== idOrLane && task.lane !== idOrLane,
    )
  }

  /**
   * 重试指定任务或任务车道
   */
  retry(idOrLane: string, retries?: number): void {
    const tasksToRetry: Task<T>[] = []

    // 收集失败的任务
    this.queue.forEach((task) => {
      if (
        (task.id === idOrLane || task.lane === idOrLane)
        && task.status === TaskStatus.Failed
      ) {
        task.retries = retries ?? task.retries
        task.status = TaskStatus.Pending
        tasksToRetry.push(task)
      }
    })

    // 重新添加到队列
    tasksToRetry.forEach((task) => {
      this.queue.push(task)
    })

    this.processQueue()
  }

  /**
   * 是否暂停
   * @param idOrLane 任务ID或车道名
   * @returns 是否暂停
   */
  isPaused(idOrLane: string): boolean {
    return Boolean(
      this.queue.some(
        task => task.lane === idOrLane && task.status === TaskStatus.Paused,
      ),
    )
  }

  /**
   * 是否正在等待执行
   * @param idOrLane 任务ID或车道名
   * @returns 是否正在等待执行
   */
  isPending(idOrLane: string): boolean {
    return Boolean(
      this.queue.some(
        task => task.lane === idOrLane && task.status === TaskStatus.Pending,
      ),
    )
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    /** 获取每个车道的运行状态 */
    const laneStatus: Record<
      string,
      { running: number, maxConcurrent: number }
    > = {}
    this.laneRunningCount.forEach((count, lane) => {
      laneStatus[lane] = {
        running: count,
        maxConcurrent: this.options.laneConfig[lane]?.maxConcurrent || 0,
      }
    })

    return {
      queueLength: this.queue.length,
      runningCount: this.running.size,
      maxConcurrent: this.options.maxConcurrent,
      lanes: laneStatus,
      tasks: {
        pending: this.queue.filter(t => t.status === 'pending').length,
        running: this.running.size,
        paused: this.queue.filter(t => t.status === 'paused').length,
        failed: this.queue.filter(t => t.status === 'failed').length,
        completed: this.queue.filter(t => t.status === 'completed').length,
        cancelled: this.queue.filter(t => t.status === 'cancelled').length,
      },
    }
  }

  /**
   * 获取任务
   */
  get(idOrLane: string): Task<T> | undefined {
    return (
      this.queue.find(t => t.id === idOrLane || t.lane === idOrLane)
      ?? this.running.get(idOrLane)
    )
  }

  /**
   * 是否有正在运行的任务
   */
  hasRunning(): boolean {
    return this.running.size > 0
  }

  /**
   * 获取车道的运行状态
   */
  getLaneStatus(lane: string) {
    const laneConfig = this.options.laneConfig[lane]
    const runningCount = this.getLaneRunningCount(lane)

    return {
      name: lane,
      running: runningCount,
      maxConcurrent: laneConfig?.maxConcurrent || 0,
      priority: laneConfig?.priority || 0,
      hasConfig: !!laneConfig,
    }
  }

  /**
   * 尝试抢占车道
   */
  tryOvertaking(id: string, lane: string, priority?: number): boolean {
    const task = this.get(id)
    if (!task)
      return false

    if (
      task.status === TaskStatus.Pending
      || task.status === TaskStatus.Running
      || task.status === TaskStatus.Paused
    ) {
      task.lane = lane
      task.priority = priority ?? task.priority
      this.sort()
      this.processQueue()
      return true
    }

    return false
  }

  /**
   *  尝试恢复任务
   */
  tryResume(id: string): boolean {
    const task = this.get(id)
    if (!task)
      return false

    if (task.status === TaskStatus.Paused) {
      this.resume(id)
      return true
    }

    return false
  }

  /**
   * 设置车道配置
   */
  setLaneConfig(lane: string, config: Partial<LaneConfig>): void {
    const currentConfig = this.options.laneConfig[lane] || {
      name: lane,
      priority: 0,
      maxConcurrent: this.options.maxConcurrent,
    }

    this.options.laneConfig[lane] = {
      ...currentConfig,
      ...config,
    }

    // 初始化车道运行计数（如果尚未初始化）
    if (!this.laneRunningCount.has(lane)) {
      this.laneRunningCount.set(lane, 0)
    }

    // 重新排序队列
    this.sort()
    // 尝试处理队列
    this.processQueue()
  }

  /**
   * 等待队列空闲
   */
  async waitIdle(time = 100): Promise<void> {
    if (!this.hasRunning()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, time))
    await this.waitIdle()
  }

  /**
   * 等待特定车道空闲
   */
  async waitLaneIdle(lane: string, time = 100): Promise<void> {
    if (this.getLaneRunningCount(lane) === 0) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, time))
    await this.waitLaneIdle(lane, time)
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue.forEach((task) => {
      task.status = TaskStatus.Cancelled
      task.reject(new SchedulerError.QueueCleared())
    })
    this.queue = []
    this.running.clear()

    // 重置所有车道运行计数
    this.laneRunningCount.clear()
    Object.keys(this.options.laneConfig).forEach((laneName) => {
      this.laneRunningCount.set(laneName, 0)
    })
  }

  /**
   * 增加车道运行计数
   */
  private incrementLaneRunningCount(lane: string): void {
    const currentCount = this.laneRunningCount.get(lane) || 0
    this.laneRunningCount.set(lane, currentCount + 1)
  }

  /**
   * 减少车道运行计数
   */
  private decrementLaneRunningCount(lane: string): void {
    const currentCount = this.laneRunningCount.get(lane) || 0
    if (currentCount > 0) {
      this.laneRunningCount.set(lane, currentCount - 1)
    }
  }

  /**
   * 获取车道当前运行任务数
   */
  private getLaneRunningCount(lane: string): number {
    return this.laneRunningCount.get(lane) || 0
  }

  /**
   * 检查车道是否可以运行更多任务
   */
  private canLaneRunMoreTasks(lane: string): boolean {
    const laneConfig = this.options.laneConfig[lane]
    if (!laneConfig)
      return true // 如果没有车道配置，则不限制

    const currentCount = this.getLaneRunningCount(lane)
    return currentCount < laneConfig.maxConcurrent
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    // 检查全局并发限制
    if (this.running.size >= this.options.maxConcurrent) {
      return
    }

    /** 找到下一个可以执行的任务 */
    const nextTask = this.queue.find((task) => {
      // 任务必须是待执行状态且未暂停
      if (task.status !== TaskStatus.Pending || this.isPaused(task.id)) {
        return false
      }

      // 如果任务有车道，检查车道并发限制
      if (task.lane && !this.canLaneRunMoreTasks(task.lane)) {
        return false
      }

      return true
    })

    if (!nextTask)
      return

    this.running.set(nextTask.id, nextTask)
    nextTask.status = TaskStatus.Running

    // 更新车道运行计数
    if (nextTask.lane) {
      this.incrementLaneRunningCount(nextTask.lane)
    }

    try {
      let timeoutId: number | undefined

      const executeWithTimeout = async () => {
        if (nextTask.timeout) {
          const timeoutPromise = new Promise<T>((_, reject) => {
            timeoutId = window.setTimeout(() => {
              console.warn('Task timeout', nextTask.id)
              reject(new SchedulerError.TaskTimeout())
            }, nextTask.timeout)
          })

          return Promise.race([nextTask.execute(), timeoutPromise])
        }

        return nextTask.execute()
      }

      const result = await this.executeWithRetry(
        executeWithTimeout,
        nextTask.retries || 0,
        nextTask,
      )

      if (timeoutId)
        clearTimeout(timeoutId)
      nextTask.status = TaskStatus.Completed
      nextTask.resolve(result)
    }
    catch (error) {
      nextTask.status = TaskStatus.Failed
      nextTask.reject(error as Error)
    }
    finally {
      this.running.delete(nextTask.id)

      // 更新车道运行计数
      if (nextTask.lane) {
        this.decrementLaneRunningCount(nextTask.lane)
      }

      // 继续处理队列
      this.processQueue()
    }
  }

  /**
   * 带重试的执行
   */
  private async executeWithRetry(
    fn: () => Promise<T>,
    retriesLeft: number,
    task: Task<T>,
  ): Promise<T> {
    try {
      return await fn()
    }
    catch (error) {
      if (retriesLeft > 0 && task.status !== 'cancelled') {
        console.warn('Task retry', task.id)
        await new Promise(resolve =>
          setTimeout(resolve, this.options.defaultRetryDelay),
        )
        return this.executeWithRetry(fn, retriesLeft - 1, task)
      }
      throw error
    }
  }

  /**
   * 排序队列
   */
  private sort(): void {
    // 先按车道优先级排序，再按任务优先级排序
    this.queue.sort((a, b) => {
      /** 获取车道优先级 */
      const aLanePriority = a.lane
        ? this.options.laneConfig[a.lane]?.priority || 0
        : 0
      const bLanePriority = b.lane
        ? this.options.laneConfig[b.lane]?.priority || 0
        : 0

      // 先比较车道优先级
      if (aLanePriority !== bLanePriority) {
        return aLanePriority - bLanePriority
      }

      // 车道优先级相同时比较任务优先级
      return a.priority - b.priority
    })
  }
}
