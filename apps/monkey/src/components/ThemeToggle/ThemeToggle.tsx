import type { SlotsType } from 'vue'
import type { ThemeMode } from '@/utils/theme'
import { defineComponent, ref } from 'vue'
import { Icon } from '@/icons'
import { clsx } from '@/utils/clsx'
import { userSettings } from '@/utils/userSettings'

interface ThemeOption {
  value: ThemeMode
  label: string
  icon: string
  title: string
}

const OPTIONS: ThemeOption[] = [
  { value: 'system', label: '自动', icon: 'THEME_SYSTEM', title: '跟随系统' },
  { value: 'light', label: '浅色', icon: 'THEME_LIGHT', title: '浅色' },
  { value: 'dark', label: '深色', icon: 'THEME_DARK', title: '深色' },
]

/** 共享单例 ref：DesktopSider 与 MobileSider 都会挂载 ThemeToggle，需保持高亮同步 */
const currentMode = ref<ThemeMode>(userSettings.value.theme)
function pickMode(mode: ThemeMode) {
  currentMode.value = mode
  userSettings.value.theme = mode
}

const slots = {} as SlotsType<{ default: () => void }>

const ThemeToggle = defineComponent({
  name: 'ThemeToggle',
  slots,
  setup() {
    return () => (
      <div
        class={clsx({
          root: [
            'flex items-center gap-1 rounded-xl',
            'bg-base-content/10 p-1',
          ],
        }).root}
        role="radiogroup"
        aria-label="主题"
      >
        {OPTIONS.map((opt) => {
          const active = currentMode.value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.title}
              class={clsx({
                btn: [
                  'flex-1 cursor-pointer rounded-lg px-2 py-1.5',
                  'flex items-center justify-center gap-1',
                  'text-xs transition-colors',
                  active
                    ? 'bg-base-100 text-base-content shadow-sm'
                    : 'text-base-content/60 hover:text-base-content',
                ],
              }).btn}
              onClick={() => pickMode(opt.value)}
            >
              <Icon name={opt.icon} class="text-base" />
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>
    )
  },
})

export default ThemeToggle
