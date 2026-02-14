import type { SlotsType } from 'vue'
import { GM_info } from '$'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  root: [
    'fixed top-0 left-0 bottom-0 w-[var(--sider-width)] flex flex-col px-4 pb-4 z-100 max-sm:hidden',
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
    icon: 'mdi:github',
    href: GM_info.script.homepage,
    title: 'GitHub',
  },
  {
    icon: 'logos:telegram',
    href: 'https://t.me/+EzfL2xXhlOA4ZjBh',
    title: 'Telegram',
  },
  {
    icon: 'mdi:question-mark-circle',
    href: `${GM_info.script.homepage}/discussions/categories/q-a`,
    title: 'Q&A',
  },
  {
    text: `Version: ${GM_info.script.version}`,
    class: 'w-full',
  },
]

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
                class={[styles.externalLinkItem, item.class]}
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
