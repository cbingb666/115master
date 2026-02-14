import type { SlotsType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import PKG from '@/../package.json'
import { ICON_GITHUB, ICON_QA } from '@/icons'
import { clsx } from '@/utils/clsx'

interface ExternalLinkItem {
  icon?: string
  text?: string
  href: string
  title?: string
}

const styles = clsx({
  root: [
    'fixed top-0 bottom-0 left-0 z-100 flex w-(--sider-width) flex-col px-4 pb-4 max-sm:hidden',
  ],
  divider: [
    'divider divider-neutral my-1',
  ],
  externalLink: 'flex flex-wrap gap-2',
  externalLinkItem: 'flex items-baseline-last justify-between text-xs',
  externalLinkItemIcon: 'text-lg',
  externalLinkItemText: 'text-base-content/50',
})

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

/**
 * 侧边栏组件
 */
const Sider = defineComponent({
  name: 'Sider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div class={styles.root}>
        {slots.default?.()}

        <div class={styles.externalLink}>
          {
            ExternalLink.map(item => (
              <a
                key={item.href}
                class={[styles.externalLinkItem]}
                href={item.href}
                target="_blank"
                title={item.title}
              >
                {item.icon && (
                  <Icon
                    class={styles.externalLinkItemIcon}
                    icon={item.icon}
                  />
                )}
                {
                  item.text && (
                    <span class={styles.externalLinkItemText}>
                      {item.text}
                    </span>
                  )
                }
              </a>
            ))
          }
        </div>
      </div>
    )
  },
})

export default Sider
