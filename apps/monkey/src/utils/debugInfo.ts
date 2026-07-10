import { GM_info } from '$'
import { appLogger } from './logger'

/**
 * 调试信息
 */
export class DebugInfo {
  logger = appLogger.sub('DebugInfo')

  constructor() {
  }

  bootstrapInfo() {
    this.logger.info(
      `
${GM_info.script.name} 启动成功，喜欢这个脚本的话，帮我在主页点个Star吧！
版本: ${GM_info.script.version}
作者: ${GM_info.script.author}
描述: ${GM_info.script.description}
主页: ${GM_info.script.homepage}
Issues: ${GM_info.script.supportURL}
常见问题: ${GM_info.script.homepage}/discussions/categories/q-a
开始执行脚本时间：${performance.now()} ms
refferer: ${window.location.href}`,
    )
  }
}

export const debugInfo = new DebugInfo()
