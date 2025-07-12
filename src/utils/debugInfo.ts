import { GM_info } from '$'
import { Logger } from './logger'

/**
 * 调试信息
 */
export class DebugInfo {
  Logger: Logger

  constructor() {
    this.Logger = new Logger('115Master', 'DebugInfo')
  }

  bootstrapInfo() {
    this.Logger.log(
      'bootstrap-info',
      `
${GM_info.script.name} 启动成功，喜欢这个脚本的话，帮我在主页点个 Star 吧！
版本: ${GM_info.script.version}
作者: ${GM_info.script.author}
描述: ${GM_info.script.description}
主页: ${GM_info.script.homepage}
开始执行脚本时间：${performance.now()} ms
refferer: ${window.location.href}
        `,
    )
  }
}

export const debugInfo = new DebugInfo()
