import type { MenuItem } from './Menu.types'
import { I } from '@/icons'

export const MENU_CONFIG: MenuItem[] = [
  {
    icon: I.ALL_FILE,
    name: '全部',
    to: {
      name: 'drive',
      params: {
        cid: '',
      },
    },
    activeMatch: {
      name: 'drive',
      notParams: { area: ['star', 'recent', 'trash', 'share', 'search'] },
    },
  },
  // {
  //   icon: 'material-symbols:save-clock',
  //   iconColor: 'text-blue-100',
  //   name: '最近添加',
  //   to: '/drive/recent',
  // },
  {
    icon: I.STAR,
    name: '星标',
    to: '/drive/star',
    activeMatch: {
      name: 'drive',
      params: { area: 'star' },
    },
  },
  // {
  //   icon: 'material-icon-theme:folder-shared',
  //   name: '分享',
  //   to: '/drive/share',
  // },
  // {
  //   icon: 'material-icon-theme:folder-trash',
  //   name: '回收站',
  //   to: '/drive/trash',
  // },
]
