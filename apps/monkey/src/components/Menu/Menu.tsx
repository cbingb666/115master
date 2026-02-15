import type { SlotsType } from 'vue'
import type { MenuItem } from './Menu.types'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { MENU_CONFIG } from './config'

const Menu = defineComponent({
  name: 'Menu',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: () => {
    function isActive(menu: MenuItem) {
      const route = useRoute()

      // 优先使用 activeMatch 进行匹配
      if (menu.activeMatch) {
        const { name, params } = menu.activeMatch
        const matched = route.matched.some(item => item.name === name)
        if (!matched)
          return false
        if (params) {
          return Object.entries(params).every(
            ([key, value]) => Reflect.get(route.params, key) === value,
          )
        }
        return true
      }

      // 回退：如果 menu.to 是字符串，按路径前缀匹配
      if (typeof menu.to === 'string') {
        return route.path === menu.to || route.path.startsWith(`${menu.to}/`)
      }

      return false
    }

    return () => (
      <ul class="flex w-full flex-col gap-1">
        {
          MENU_CONFIG.map(menu => (
            <li key={menu.name}>
              <RouterLink
                class={[
                  'btn btn-md btn-ghost w-full justify-start gap-3 px-6',
                  isActive(menu) && 'btn-active btn-primary',
                ]}
                to={menu.to}
              >
                <Icon
                  class={[
                    'text-2xl',
                    menu.iconColor,
                  ]}
                  icon={menu.icon}
                />
                {menu.name}
              </RouterLink>
            </li>
          ))
        }
      </ul>
    )
  },
})

export default Menu
