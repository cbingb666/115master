import type { ILogger, LogLevel, LogMethod } from './types.ts'

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: number
  level: LogLevel
  names: string[]
  messages: unknown[]
}

/**
 * 日志类
 * @description 通用日志实现，支持日志收集、静默模式和子日志
 * @example
 * const logger = new Logger('MyApp', 'UserModule')
 * logger.info('login', '用户登录成功')
 */
export class Logger implements ILogger {
  protected names: string[]
  private silentMode: boolean = false
  private logs: LogEntry[] = []
  private subLoggers: Logger[] = []

  /**
   * 构造函数
   * @param names 名称列表
   */
  constructor(...names: string[]) {
    this.names = names.filter(name => name !== '')
  }

  get trace(): LogMethod {
    if (this.silentMode) {
      return this.createLogMethod('trace', console.trace)
    }
    /**
     * 非静默模式：直接返回 bind 后的方法以完全保留调用栈
     * 注意：非静默模式下不会收集日志，如需收集日志请启用静默模式
     */
    return console.trace.bind(console, ...this.formatNames())
  }

  get debug(): LogMethod {
    if (this.silentMode) {
      return this.createLogMethod('debug', console.debug)
    }
    return console.debug.bind(console, ...this.formatNames())
  }

  get info(): LogMethod {
    if (this.silentMode) {
      return this.createLogMethod('info', console.info)
    }
    return console.info.bind(console, ...this.formatNames())
  }

  get log(): LogMethod {
    if (this.silentMode) {
      return this.createLogMethod('log', console.log)
    }
    return console.log.bind(console, ...this.formatNames())
  }

  get warn(): LogMethod {
    if (this.silentMode) {
      return this.createLogMethod('warn', console.warn)
    }
    return console.warn.bind(console, ...this.formatNames())
  }

  get error(): LogMethod {
    if (this.silentMode) {
      return this.createLogMethod('error', console.error)
    }
    return console.error.bind(console, ...this.formatNames())
  }

  /**
   * 以 console.dir 形式打印所有收集的日志（包括所有子模块的日志）
   */
  printLogsUsingDir(...messages: string[]) {
    const allLogs = this.getAllLogs()
    if (allLogs.length === 0) {
      this.info('没有收集到任何日志')
      return
    }

    console.log(...this.formatNames(), ...messages)
    return console.dir(this.getStructuredLogsFromEntries(allLogs))
  }

  /**
   * 以 console.table 形式打印所有收集的日志（包括所有子模块的日志）
   */
  printLogsUsingTable(...messages: string[]) {
    const allLogs = this.getAllLogs()
    if (allLogs.length === 0) {
      this.info('没有收集到任何日志')
      return
    }

    console.log(...this.formatNames(), ...messages)
    return console.table(this.getStructuredLogsFromEntries(allLogs))
  }

  /**
   * 获取结构化日志
   * @returns 结构化日志
   */
  getStructuredLogs() {
    return this.getStructuredLogsFromEntries(this.logs)
  }

  /**
   * 启用静默模式（收集日志但不打印）
   */
  enableSilentMode(): void {
    this.silentMode = true
  }

  /**
   * 禁用静默模式（立即打印日志）
   */
  disableSilentMode(): void {
    this.silentMode = false
  }

  /**
   * 清空收集的日志
   */
  clearLogs(): void {
    this.subLoggers.forEach(subLogger => subLogger.clearLogs())
    this.logs = []
  }

  /**
   * 获取收集的日志数量
   */
  getLogCount(): number {
    return this.logs.length
  }

  /**
   * 创建子日志实例
   * @param names 子日志名称
   * @returns 子日志实例
   */
  sub(...names: string[]): Logger {
    const subLogger = new Logger(...this.names, ...names)
    // 继承静默模式设置
    if (this.silentMode) {
      subLogger.enableSilentMode()
    }
    // 将子 Logger 注册到父 Logger
    this.subLoggers.push(subLogger)
    return subLogger
  }

  /**
   * 递归收集当前 Logger 和所有子 Logger 的日志
   * @returns 所有日志条目
   */
  protected getAllLogs(): LogEntry[] {
    const allLogs: LogEntry[] = [...this.logs]

    // 递归收集所有子 Logger 的日志
    for (const subLogger of this.subLoggers) {
      allLogs.push(...subLogger.getAllLogs())
    }

    // 按时间戳排序
    return allLogs.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * 从日志条目数组生成结构化日志
   * @param entries 日志条目数组
   * @returns 结构化日志
   */
  private getStructuredLogsFromEntries(entries: LogEntry[]) {
    const logs = entries.map((log) => {
      const date = new Date(log.timestamp)
      const time = date.toLocaleString()
      const namesStr = log.names.join(' > ')

      return {
        time,
        level: log.level.toUpperCase(),
        names: namesStr,
        messages: log.messages,
      }
    })
    return logs
  }

  /**
   * 收集日志
   */
  private collectLog(level: LogEntry['level'], ...messages: unknown[]): void {
    this.logs.push({
      timestamp: Date.now(),
      level,
      names: [...this.names],
      messages: [...messages],
    })
  }

  /**
   * 创建日志方法
   */
  private createLogMethod(level: LogEntry['level'], consoleMethod: (...args: unknown[]) => void): LogMethod {
    return (...messages: unknown[]) => {
      if (this.silentMode) {
        // 静默模式：只收集不打印
        this.collectLog(level, ...messages)
      }
      else {
        // 正常模式：立即打印
        consoleMethod(...this.formatNames(), ...messages)
        // 同时收集日志（可选）
        this.collectLog(level, ...messages)
      }
    }
  }

  private formatNames(): string[] {
    const names = this.names
    const [firstName, ...restNames] = names
    return [
      `[${firstName}] ${restNames.map(name => `[${name}]`).join(' ')}`,
    ]
  }
}
