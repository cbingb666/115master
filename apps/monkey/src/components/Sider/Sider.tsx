import type { SlotsType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import PKG from '@/../package.json'
import { ICON_GITHUB, ICON_QA } from '@/icons'

interface ExternalLinkItem {
  icon?: string
  text?: string
  href: string
  title?: string
}

const ExternalLink = [
  {
    icon: ICON_GITHUB,
    href: PKG.homepage,
    title: 'GitHub',
  },
  {
    icon: ICON_QA,
    href: `${PKG.homepage}/discussions/categories/q-a`,
    title: 'Q&A',
  },
  {
    href: `${PKG.homepage}/releases/tag/v${PKG.version}`,
    title: `v${PKG.version} Release Notes`,
    text: `v${PKG.version}`,
  },
] satisfies ExternalLinkItem[]

const Sider = defineComponent({
  name: 'Sider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div
        class="
          fixed top-0 bottom-0 left-0 z-100 flex w-(--sider-width) flex-col
          px-4 pb-4 max-sm:hidden
        "
      >
        {slots.default?.()}

        <div class="flex flex-wrap gap-2">
          {ExternalLink.map(item => (
            <a
              key={item.href}
              class="flex items-baseline-last justify-between text-xs"
              href={item.href}
              target="_blank"
              title={item.title}
            >
              {item.icon && (
                <Icon class="text-lg" icon={item.icon} />
              )}
              {item.text && (
                <span class="text-base-content/50">{item.text}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    )
  },
})

export default Sider
