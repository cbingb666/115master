import type { SlotsType } from 'vue'
import type { MenuItem } from '@/components/Layout/Menu/Menu.types'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { MENU_CONFIG } from '@/components/Layout/Menu/config'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  menu: 'flex w-full flex-col gap-1',
  menuItem: 'btn btn-md btn-secondary btn-ghost w-full justify-start gap-3 px-6',
  menuItemActive: 'btn-active',
  menuItemIcon: 'text-2xl',
})

/**
 * 菜单组件
 */
const Menu = defineComponent({
  name: 'Menu',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: () => {
    function isActive(menu: MenuItem) {
      const route = useRoute()

      // 如果 menu.to 是对象且有 name 属性，按路由名称匹配
      if (typeof menu.to === 'object' && 'name' in menu.to && menu.to.name) {
        const routeName = (menu.to as { name: string }).name
        return route.matched.some(item => item.name === routeName)
      }

      // 如果 menu.to 是字符串，按路径匹配
      if (typeof menu.to === 'string') {
        return route.path === menu.to || route.path.startsWith(`${menu.to}/`)
      }

      return false
    }

    return () => (
      <ul class={styles.menu}>
        {
          MENU_CONFIG.map(menu => (
            <li key={menu.name}>
              <RouterLink
                class={[
                  styles.menuItem,
                  isActive(menu) && styles.menuItemActive,
                ]}
                to={menu.to}
              >
                <Icon
                  class={[
                    styles.menuItemIcon,
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
