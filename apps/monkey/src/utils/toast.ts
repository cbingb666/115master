/**
 * 轻量级页面级 Toast 提示
 * @description 用于首页（Mod 模式，非 Vue 应用）场景下的非阻塞消息提示，
 * 使用固定定位 + 内联样式，避免污染或依赖 115 页面样式
 */

/** Toast 类型 */
export type ToastType = 'info' | 'success' | 'error' | 'loading'

/** Toast 容器 id */
const CONTAINER_ID = '115master-toast-container'

/** 类型对应的强调色 */
const TYPE_COLOR: Record<ToastType, string> = {
  info: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  loading: '#3b82f6',
}

/** 类型对应的图标 */
const TYPE_ICON: Record<ToastType, string> = {
  info: 'ℹ️',
  success: '✅',
  error: '❌',
  loading: '⏳',
}

/**
 * 获取（或创建）Toast 容器
 */
function getContainer(): HTMLElement {
  let container = document.getElementById(CONTAINER_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `
    document.body.appendChild(container)
  }
  return container
}

/**
 * Toast 句柄
 */
export interface ToastHandle {
  /** 更新内容 */
  update: (message: string, type?: ToastType) => void
  /** 关闭 */
  close: (delay?: number) => void
}

/**
 * 显示一个 Toast
 * @param message 消息内容
 * @param type 类型
 * @returns Toast 句柄，可用于更新或关闭
 */
export function showToast(message: string, type: ToastType = 'info'): ToastHandle {
  const container = getContainer()

  const el = document.createElement('div')
  el.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 240px;
    max-width: 420px;
    padding: 12px 16px;
    border-radius: 10px;
    background: #1f2937;
    color: #f9fafb;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    border-left: 4px solid ${TYPE_COLOR[type]};
    pointer-events: auto;
    opacity: 0;
    transform: translateX(16px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    word-break: break-all;
  `

  const iconEl = document.createElement('span')
  iconEl.textContent = TYPE_ICON[type]
  iconEl.style.cssText = 'flex-shrink: 0; font-size: 16px;'

  const textEl = document.createElement('span')
  textEl.textContent = message
  textEl.style.cssText = 'flex: 1;'

  el.append(iconEl, textEl)
  container.appendChild(el)

  /** 入场动画 */
  requestAnimationFrame(() => {
    el.style.opacity = '1'
    el.style.transform = 'translateX(0)'
  })

  let closeTimer: ReturnType<typeof setTimeout> | undefined

  const remove = () => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(16px)'
    setTimeout(() => {
      el.remove()
      if (container.childElementCount === 0) {
        container.remove()
      }
    }, 200)
  }

  return {
    update(nextMessage: string, nextType: ToastType = type) {
      textEl.textContent = nextMessage
      iconEl.textContent = TYPE_ICON[nextType]
      el.style.borderLeftColor = TYPE_COLOR[nextType]
    },
    close(delay = 0) {
      if (closeTimer) {
        clearTimeout(closeTimer)
      }
      if (delay > 0) {
        closeTimer = setTimeout(remove, delay)
      }
      else {
        remove()
      }
    },
  }
}
