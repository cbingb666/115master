import type { Sort } from './FileSortSelector.types'

export const SORT_OPTIONS: Sort[] = [
  {
    name: '创建',
    order: 'user_ptime',
    asc: 1,
    icon: 'material-symbols:history-rounded',
  },
  {
    name: '创建',
    order: 'user_ptime',
    asc: 0,
    icon: 'material-symbols:history-rounded',
  },
  {
    name: '修改',
    order: 'user_utime',
    asc: 1,
    icon: 'material-symbols:edit-calendar-rounded',
  },
  {
    name: '修改',
    order: 'user_utime',
    asc: 0,
    icon: 'material-symbols:edit-calendar-rounded',
  },
  {
    name: '打开',
    order: 'user_otime',
    asc: 1,
    icon: 'material-symbols:schedule-rounded',
  },
  {
    name: '打开',
    order: 'user_otime',
    asc: 0,
    icon: 'material-symbols:schedule-rounded',
  },
  {
    name: '名称',
    order: 'file_name',
    asc: 1,
    icon: 'material-symbols:sort-by-alpha-rounded',
  },
  {
    name: '名称',
    order: 'file_name',
    asc: 0,
    icon: 'material-symbols:sort-by-alpha-rounded',
  },
  {
    name: '大小',
    order: 'file_size',
    asc: 1,
    icon: 'mdi:database-outline',
  },
  {
    name: '大小',
    order: 'file_size',
    asc: 0,
    icon: 'mdi:database-outline',
  },
]
