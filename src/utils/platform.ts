import { GM_info } from '$'

/**
 * 是否是 Mac 平台
 */
export const isMac = GM_info.userAgentData.platform.match(/mac/i)

/**
 * 是否是 115 浏览器
 */
export const is115Browser = navigator.userAgent.match(/115Browser/i)
