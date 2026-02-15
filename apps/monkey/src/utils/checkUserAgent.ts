/**
 * 检查是否是115浏览器,如果是则弹出提示
 * 因为现在不需要修改 User-Agent 了，所以检查旧用户 UA 如果是 115Browser/27 则弹出提示删除插件
 */
export function checkUserAgent() {
  const userAgent = navigator.userAgent
  const is115Browser27 = userAgent.includes('115Browser/27')

  if (is115Browser27) {
    alert('[115master tip] 现在不需要 User-Agent Switcher and Manager 插件了')

    throw new Error(
      '115Master脚本启动失败: 现在不需要修改【User-Agent】请删除插件~',
    )
  }
}
