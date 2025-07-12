/**
 * 日志类
 * @description 日志类，用于记录日志
 * 使用示例:
 * const logger = new Logger('MyApp', 'UserModule');
 * logger.info('login', '用户登录成功');
 * 输出: MyApp UserModule login: 用户登录成功 (带有相应的颜色)
 */
export class Logger {
  /** 应用名称 */
  private appName: string
  /** 模块名称 */
  private moduleName: string

  /**
   * 构造函数
   * @param appName 应用名称
   * @param moduleName 模块名称
   */
  constructor(appName: string, moduleName: string) {
    this.appName = appName
    this.moduleName = moduleName
  }

  /**
   * 日志
   * @param logName 日志名称
   * @param args 日志参数
   */
  log(logName: string, ...args: unknown[]): void {
    if (
      args.length === 0
      || typeof args[0] === 'string'
      || typeof args[0] === 'number'
    ) {
      console.log(...this.formatMessage(logName, ...args))
    }
    else {
      console.log(...this.formatMessage(logName))
      console.log(...args)
    }
  }

  /**
   * 错误日志
   * @param logName 日志名称
   * @param msg 日志消息
   */
  error(logName: string, msg: unknown): void {
    console.log(...this.formatMessage(logName))
    console.error(msg)
  }

  /**
   * 格式化日志消息
   * @param logName 日志名称
   * @param args 日志参数
   * @returns 格式化后的日志消息
   */
  private formatMessage(logName: string, ...args: unknown[]): string[] {
    return [
      `%c${this.appName}%c ${this.moduleName}%c ${logName}%c ${args}`,
      'color: #409EFF; font-weight: bold', // appName 样式：蓝色
      'color: #67C23A; font-weight: bold', // moduleName 样式：绿色
      'color: #E6A23C; font-weight: bold', // logName 样式：黄色
      'color: inherit; margin-top: 4px', // 恢复默认样式
    ]
  }
}

/**
 * 应用日志
 */
export class AppLogger extends Logger {
  constructor(moduleName: string) {
    super('115Master', moduleName)
  }
}
