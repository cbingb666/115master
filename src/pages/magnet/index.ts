import { openOfflineTask } from '../home/TopHeaderMod/openOfflineTask'

/** 磁力链接任务键名 */
const MAGNET_TASK_KEY = 'magnetTask'

/**
 * 设置磁力链接任务
 * @param magnet 磁力链接
 */
export function setMagnetTask(magnet: string) {
  sessionStorage.setItem(MAGNET_TASK_KEY, magnet)
}

/**
 * 获取磁力链接任务
 * @returns 磁力链接
 */
export function getMagnetTask() {
  return sessionStorage.getItem(MAGNET_TASK_KEY)
}

/**
 * 移除磁力链接任务
 */
export function removeMagnetTask() {
  sessionStorage.removeItem(MAGNET_TASK_KEY)
}

/**
 * 注册磁力链接任务处理程序
 */
export function registerMagnetTaskHandler() {
  const magnetTask = getMagnetTask()
  if (magnetTask) {
    openOfflineTask(magnetTask)
    removeMagnetTask()
  }
}

/**
 * 注册磁力链接协议处理程序
 */
export function registerMagnetProtocolHandler() {
  navigator.registerProtocolHandler('magnet', '/web/lixian/master/magnet/?url=%s')
}

/**
 * 处理打开离线任务页面后
 */
export function handleOpenAfter() {
  if (window.history.length > 1) {
    window.history.back()
  }
  else {
    window.close()
  }
}

/**
 * 磁力链接页中转
 */
export function magnetPage() {
  const url = new URL(window.location.href)
  const magnet = url.searchParams.get('url')
  if (!magnet) {
    return
  }
  setMagnetTask(magnet)
  const handle = window.open('https://115.com/?cid=0&offset=0&mode=wangpan', '_blank', 'width=1280,height=860')
  if (handle) {
    handleOpenAfter()
  }
  else {
    alert('请设置允许弹出窗口并刷新页面，否则无法打开离线任务页面')
  }
}
