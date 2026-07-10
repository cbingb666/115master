import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import PKG from '@/../package.json'
import { useSponsorDialog } from '@/components/Sponsor/useSponsorDialog'
import { Icon } from '@/icons'

interface ExternalLinkItem {
  icon?: string
  text?: string
  title?: string
  href?: string
  onClick?: () => void
}

const Links = defineComponent({
  name: 'Links',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup(_, { slots }) {
    const openSponsor = useSponsorDialog()

    const links: ExternalLinkItem[] = [
      {
        icon: 'GITHUB',
        href: PKG.homepage,
        title: 'GitHub',
      },
      {
        icon: 'SPONSOR',
        title: '赞助',
        onClick: openSponsor,
      },
      {
        icon: 'QA',
        href: `${PKG.homepage}/discussions/categories/q-a`,
        title: 'Q&A',
      },
      {
        href: `${PKG.homepage}/releases/tag/v${PKG.version}`,
        title: `V${PKG.version} Release Notes`,
        text: `V${PKG.version}`,
      },
    ]

    return () => (
      <div class="flex flex-wrap gap-2">
        {slots.default?.()}
        {links.map(item => item.onClick
          ? (
              <button
                key={item.title}
                class="text-base-content/50 flex cursor-pointer items-center justify-between text-xs"
                title={item.title}
                onClick={item.onClick}
              >
                {item.icon && <Icon class="text-lg" name={item.icon} />}
                {item.text && <span>{item.text}</span>}
              </button>
            )
          : (
              <a
                key={item.href}
                class="text-base-content/50 flex items-baseline-last justify-between text-xs"
                href={item.href}
                target="_blank"
                title={item.title}
              >
                {item.icon && <Icon class="text-lg" name={item.icon} />}
                {item.text && <span>{item.text}</span>}
              </a>
            ),
        )}
      </div>
    )
  },
})

export default Links
