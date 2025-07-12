import { createApp, h } from 'vue'
import UserAgentPopup from '../components/UserAgentPopup/index.vue'

/**
 * 检查是否是115浏览器,如果是则弹出提示
 * 因为现在不需要修改 User-Agent 了，所以检查旧用户 UA 如果是 115Browser/27 则弹出提示删除插件
 */
export function checkUserAgent() {
  const userAgent = navigator.userAgent
  const is115Browser27 = userAgent.includes('115Browser/27')

  if (is115Browser27) {
    /** 创建一个容器元素 */
    const popupContainer = document.createElement('div')
    document.body.appendChild(popupContainer)

    /** 创建Vue应用并挂载UserAgentPopup组件 */
    const app = createApp({
      render() {
        return h(UserAgentPopup, {
          'visible': true,
          'onUpdate:visible': (value: boolean) => {
            if (!value) {
              // 当弹窗关闭时，卸载应用并移除容器
              setTimeout(() => {
                app.unmount()
                document.body.removeChild(popupContainer)
              }, 300) // 给动画一些时间
            }
          },
        })
      },
    })

    app.mount(popupContainer)

    // 抛出错误以阻止脚本继续执行
    throw new Error(
      '115Master脚本启动失败: 现在不需要修改【User-Agent】请删除插件~',
    )
  }
}
