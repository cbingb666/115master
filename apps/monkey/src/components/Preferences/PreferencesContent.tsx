import { defineComponent, ref } from 'vue'
import { GM_info } from '$'
import PKG from '@/../package.json'
import ThemeToggle from '@/components/ThemeToggle'
import { I, Icon } from '@/icons'

type SectionId = 'appearance' | 'about'

interface SectionItem {
  id: SectionId
  label: string
  icon: string
}

const SECTIONS: SectionItem[] = [
  { id: 'appearance', label: '外观', icon: I.THEME_LIGHT },
  { id: 'about', label: '关于', icon: I.ABOUT },
]

const PreferencesContent = defineComponent({
  name: 'PreferencesContent',
  setup() {
    const active = ref<SectionId | null>(null)

    function pick(id: SectionId) {
      active.value = id
    }

    function back() {
      active.value = null
    }

    function currentLabel() {
      return SECTIONS.find(s => s.id === active.value)?.label ?? ''
    }

    return () => {
      const showMenu = active.value === null

      return (
        <div class="flex flex-col gap-4 pt-4 pb-4 sm:flex-row">
          {/* 桌面端:始终显示左侧菜单,移动端:仅在 menu 层级显示 */}
          <nav
            class={[
              'border-base-content/10 flex shrink-0 flex-col gap-1 self-start sm:w-40 sm:border-r sm:pr-3',
              showMenu
                ? 'w-full border-b pb-2 sm:border-b-0 sm:pb-0'
                : 'hidden sm:flex',
            ]}
          >
            {SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                class={[
                  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  'text-base-content/60 hover:bg-base-content/5 hover:text-base-content',
                ]}
                onClick={() => pick(section.id)}
              >
                <Icon name={section.icon} class="text-base" />
                <span>{section.label}</span>
                <Icon name={I.RIGHT} class="text-base-content/40 ml-auto text-base" />
              </button>
            ))}
          </nav>

          {/* 移动端 menu 层级不可见、section 层级显示;桌面端反之 */}
          <div
            class={[
              'flex-1 overflow-y-auto sm:pl-3 sm:pr-1',
              showMenu ? 'hidden sm:block' : 'block',
            ]}
          >
            {/* 移动端二级:返回按钮 + 标题 */}
            <div class="flex items-center gap-2 pb-3 sm:hidden">
              <button
                type="button"
                class="text-base-content/60 hover:text-base-content flex cursor-pointer items-center gap-1 text-sm"
                onClick={back}
              >
                <Icon name={I.LEFT} class="text-base" />
                <span>返回</span>
              </button>
              <span class="text-base-content/80 text-sm font-medium">
                {currentLabel()}
              </span>
            </div>

            {active.value === 'appearance' && (
              <div class="flex flex-col gap-4">
                <div class="hidden sm:block">
                  <h3 class="text-base-content text-sm font-medium">主题</h3>
                  <p class="text-base-content/60 mt-1 text-xs">切换浅色、深色或跟随系统。</p>
                </div>
                <ThemeToggle />
              </div>
            )}

            {active.value === 'about' && (
              <div class="flex flex-col gap-4 text-sm">
                <div class="hidden sm:block">
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
