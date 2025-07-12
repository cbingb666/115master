// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

/**
 * 填充磁力链接
 * @param magnet 磁力链接
 */
function fillInputMagnet(magnet: string) {
  const inputNode = top.window.document.querySelector('#js_offline_new_add')
  if (inputNode) {
    inputNode.value = magnet ?? ''
  }
}

/**
 * 打开离线任务
 * @description
 * 代码参考了官方 core.js 中的 `offline_task` 部分
 * 并且移除了 getScript callback 中 Core.OFFL5Plug.OpenLink 的重定向刷新地址的参数
 * @see https://cdnres.115.com/site/static/js/wl_disk2014/min/core-min.js?_vh=fc9a53e_88
 * @param magnet 磁力链接 如果传入，则自动填充到输入框中
 */
export function openOfflineTask(magnet?: string) {
  if (top.window.Core.OFFL5Plug) {
    top.Core.OFFL5Plug.OpenLink()
    fillInputMagnet(magnet)
  }
  else {
    top.$.getScript(
      __uri('//cdnres.115.com/site/static/plug/offline_wl/offline5.0.js'),
      () => {
        top.Core.OFFL5Plug.AddClient({})
        top.window.Core.OFFL5Plug.OpenLink()
        fillInputMagnet(magnet)
      },
    )
  }
}
