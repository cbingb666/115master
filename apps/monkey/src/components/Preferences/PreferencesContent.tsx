import { defineComponent, ref } from 'vue'
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
    const active = ref<SectionId>('appearance')

    return () => (
      <div class="flex gap-4 pt-4 pb-4">
        <nav class="border-base-content/10 flex w-40 shrink-0 flex-col gap-1 border-r pr-3">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              type="button"
              class={[
                'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                active.value === section.id
                  ? 'bg-base-content/10 text-base-content font-medium'
                  : 'text-base-content/60 hover:bg-base-content/5 hover:text-base-content',
              ]}
              onClick={() => active.value = section.id}
            >
              <Icon name={section.icon} class="text-base" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div class="flex-1 overflow-y-auto pl-3 pr-1">
          {active.value === 'appearance' && (
            <div class="flex flex-col gap-4">
              <div>
                <h3 class="text-base-content text-sm font-medium">主题</h3>
                <p class="text-base-content/60 mt-1 text-xs">切换浅色、深色或跟随系统。</p>
              </div>
              <ThemeToggle />
            </div>
          )}

          {active.value === 'about' && (
            <div class="flex flex-col gap-4 text-sm">
              <div>
                <h3 class="text-base-content font-medium">{PKG.description}</h3>
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
  },
})

export default PreferencesContent
