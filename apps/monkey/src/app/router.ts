import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from '@/app/routes'

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: async (_to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    else {
      return { top: 0 }
    }
  },
})
