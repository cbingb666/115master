import type { PropType } from 'vue'
import type { IconValue } from '@/icons'
import { GM_info } from '$'
import { scrollbar } from '@115master/ui'
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import PKG from '@/../package.json'
import ThemeToggle from '@/components/ThemeToggle'
import { I, Icon } from '@/icons'

export type PreferenceSection = 'appearance' | 'about'

interface SectionItem {
  id: PreferenceSection
  label: string
  icon: IconValue
}

export const PREFERENCE_SECTIONS: SectionItem[] = [
  { id: 'appearance', label: '外观', icon: I.THEME_LIGHT },
  { id: 'about', label: '关于', icon: I.ABOUT },
]

const DESKTOP_MQ = '(min-width: 640px)'

const PreferencesContent = defineComponent({
  name: 'PreferencesContent',

  props: {
    section: {
      type: String as PropType<PreferenceSection | null>,
      default: null,
    },
  },

  emits: {
    'update:section': (_section: PreferenceSection) => true,
  },

  setup(props, { emit }) {
    const isDesktop = ref(false)
    let mql: MediaQueryList | undefined

    onMounted(() => {
      mql = window.matchMedia(DESKTOP_MQ)
      isDesktop.value = mql.matches
      mql.addEventListener('change', onChange)
    })

    onBeforeUnmount(() => {
      mql?.removeEventListener('change', onChange)
    })

    function onChange(e: MediaQueryListEvent) {
      isDesktop.value = e.matches
    }

    /** 桌面端无选中时回退到第一项,移动端保持 null 表示一级菜单 */
    const display = computed<PreferenceSection | null>(() => {
      if (props.section)
        return props.section
      return isDesktop.value ? PREFERENCE_SECTIONS[0].id : null
    })

    function pick(section: PreferenceSection) {
      emit('update:section', section)
    }

    return () => {
      const showMenu = props.section === null

      return (
        <div class="flex flex-col gap-4 sm:min-h-[28rem] sm:flex-row">
          {/* 桌面端:始终显示左侧菜单,移动端:仅在 menu 层级显示 */}
          <nav
            class={[
              'border-base-content/10 flex shrink-0 flex-col gap-1 self-start sm:w-40 sm:border-r sm:pr-3',
              showMenu
                ? 'w-full'
                : 'hidden sm:flex',
            ]}
          >
            {PREFERENCE_SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                class={[
                  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ease-[var(--ui-ease-standard)]',
                  display.value === section.id
                    ? 'bg-base-content/10 text-base-content font-medium'
                    : 'text-base-content/60 hover:bg-base-content/5 hover:text-base-content',
                ]}
                onClick={() => pick(section.id)}
              >
                <Icon name={section.icon} class="text-base" />
                <span>{section.label}</span>
                <Icon name={I.RIGHT} class="text-base-content/40 ml-auto text-base sm:hidden" />
              </button>
            ))}
          </nav>

          {/* 移动端 menu 层级不可见、section 层级显示;桌面端反之 */}
          <div
            class={[
              ...scrollbar(),
              'flex-1 overflow-y-auto sm:pr-1 sm:pl-3',
              showMenu ? 'hidden sm:block' : 'block',
            ]}
          >
            {display.value === 'appearance' && (
              <div class="flex flex-col gap-4">
                <div>
                  <h3 class="text-base-content text-sm font-medium">主题</h3>
                  <p class="text-base-content/60 mt-1 text-xs">切换浅色、深色或跟随系统。</p>
                </div>
                <ThemeToggle />
              </div>
            )}

            {display.value === 'about' && (
              <div class="flex flex-col gap-4 text-sm">
                <div>
                  <h3 class="text-base-content font-medium">{GM_info.script.name}</h3>
                  <p class="text-base-content/60 mt-1 text-xs">
                    v
                    {PKG.version}
                  </p>
                </div>
                <div class="flex flex-col gap-2">
                  <a
                    class="border-base-content/10 hover:bg-base-content/5 flex items-center justify-between rounded-lg border px-3 py-2"
                    href={PKG.homepage}
                    target="_blank"
                    title="GitHub 主页"
                  >
                    <span class="flex items-center gap-2">
                      <Icon name={I.GITHUB} class="text-base" />
                      <span>GitHub 主页</span>
                    </span>
                    <Icon name={I.RIGHT} class="text-base-content/40 text-base" />
                  </a>
                  <a
                    class="border-base-content/10 hover:bg-base-content/5 flex items-center justify-between rounded-lg border px-3 py-2"
                    href={PKG.funding}
                    target="_blank"
                    title="赞助"
                  >
                    <span class="flex items-center gap-2">
                      <Icon name={I.SPONSOR} class="text-base" />
                      <span>赞助</span>
                    </span>
                    <Icon name={I.RIGHT} class="text-base-content/40 text-base" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  },
})

export default PreferencesContent
