import { ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const APP_ROOT_ID = 'my-app'

/** 主题对应的根容器背景色（防止挂载前白闪/黑闪）；light 与 base-100 完全一致 */
const APP_BG: Record<ResolvedTheme, string> = {
  dark: '#000',
  light: '#fff',
}

/** 当前主题模式（含跟随系统） */
export const themeMode = ref<ThemeMode>('system')

/** 当前实际生效主题（解析 system 后） */
export const resolvedTheme = ref<ResolvedTheme>('dark')

function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'light')
    return 'light'
  if (mode === 'dark')
    return 'dark'
  return systemPrefersDark() ? 'dark' : 'light'
}

/** 把当前主题写到 DOM */
function applyToDOM(theme: ResolvedTheme) {
  const root = document.getElementById(APP_ROOT_ID)
  if (!root)
    return
  const background = APP_BG[theme]
  document.documentElement.setAttribute('data-theme', theme)
  root.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
  document.documentElement.style.backgroundColor = background
  document.body.style.backgroundColor = background
  root.style.backgroundColor = background
}

/** 同步当前主题到 DOM（不修改主题模式） */
export function syncResolvedTheme() {
  const next = resolve(themeMode.value)
  resolvedTheme.value = next
  applyToDOM(next)
}

/** 切换主题模式（仅写 ref + DOM，持久化由调用方负责） */
export function setThemeMode(mode: ThemeMode) {
  themeMode.value = mode
  syncResolvedTheme()
}

/** 初始化：应用当前模式并启动系统主题监听（仅在启动时调用一次） */
export function initTheme() {
  syncResolvedTheme()
  const mql = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
  if (!mql)
    return
  mql.addEventListener('change', () => {
    if (themeMode.value !== 'system')
      return
    syncResolvedTheme()
  })
}
