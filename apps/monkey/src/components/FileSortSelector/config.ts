import type { Sort } from './FileSortSelector.types'

export const SORT_OPTIONS: Sort[] = [
  {
    name: '最近创建',
    order: 'user_ptime',
    asc: 0,
    icon: 'material-symbols:trending-down-rounded',
  },
  {
    name: '最早创建',
    order: 'user_ptime',
    asc: 1,
    icon: 'material-symbols:trending-up-rounded',
  },
  {
    name: '最近修改',
    order: 'user_utime',
    asc: 0,
    icon: 'material-symbols:trending-down-rounded',
  },
  {
    name: '最早修改',
    order: 'user_utime',
    asc: 1,
    icon: 'material-symbols:trending-up-rounded',
  },
  {
    name: '最近打开',
    order: 'user_otime',
    asc: 0,
    icon: 'material-symbols:trending-down-rounded',
  },
  {
    name: '最早打开',
    order: 'user_otime',
    asc: 1,
    icon: 'material-symbols:trending-up-rounded',
  },
  {
    name: 'A优先',
    order: 'file_name',
    asc: 1,
    icon: 'material-symbols:trending-up-rounded',
  },
  {
    name: 'Z优先',
    order: 'file_name',
    asc: 0,
    icon: 'material-symbols:trending-down-rounded',
  },
  {
    name: '最大',
    order: 'file_size',
    asc: 0,
    icon: 'material-symbols:trending-down-rounded',
  },
  {
    name: '最小',
    order: 'file_size',
    asc: 1,
    icon: 'material-symbols:trending-up-rounded',
  },
]
