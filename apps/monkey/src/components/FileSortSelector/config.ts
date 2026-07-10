import type { Sort } from './FileSortSelector.types'
import { I } from '@/icons'

export const SORT_OPTIONS: Sort[] = [
  {
    name: '创建',
    order: 'user_ptime',
    asc: 1,
    icon: I.SORT_HISTORY,
  },
  {
    name: '创建',
    order: 'user_ptime',
    asc: 0,
    icon: I.SORT_HISTORY,
  },
  {
    name: '修改',
    order: 'user_utime',
    asc: 1,
    icon: I.SORT_EDIT_CALENDAR,
  },
  {
    name: '修改',
    order: 'user_utime',
    asc: 0,
    icon: I.SORT_EDIT_CALENDAR,
  },
  {
    name: '打开',
    order: 'user_otime',
    asc: 1,
    icon: I.SORT_SCHEDULE,
  },
  {
    name: '打开',
    order: 'user_otime',
    asc: 0,
    icon: I.SORT_SCHEDULE,
  },
  {
    name: '名称',
    order: 'file_name',
    asc: 1,
    icon: I.SORT_ALPHA,
  },
  {
    name: '名称',
    order: 'file_name',
    asc: 0,
    icon: I.SORT_ALPHA,
  },
  {
    name: '大小',
    order: 'file_size',
    asc: 1,
    icon: I.SORT_DATABASE,
  },
  {
    name: '大小',
    order: 'file_size',
    asc: 0,
    icon: I.SORT_DATABASE,
  },
]
