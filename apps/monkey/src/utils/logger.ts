import { Logger } from '@115master/shared'
import PKG from '@/../package.json'

/**
 * 应用日志
 */
export class AppLogger extends Logger {
  constructor(...names: string[]) {
    super(PKG.name, ...names)
  }
}

/**
 * 应用日志实例
 */
export const appLogger = new AppLogger()

// Re-export Logger for convenience
export { Logger } from '@115master/shared'
export type { ILogger } from '@115master/shared'
