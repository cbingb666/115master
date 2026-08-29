import type { Sort } from './FileSortSelector.types'
import { I } from '@/icons'

export const SORT_OPTIONS: Sort[] = [
  {
    name: '创建',
    order: 'user_ptime',
    asc: 1,
    typeIcon: I.SORT_CREATED,
    icon: I.SORT_CREATED_ASC,
  },
  {
    name: '修改',
    order: 'user_utime',
    asc: 1,
    typeIcon: I.SORT_UPDATED,
    icon: I.SORT_UPDATED_ASC,
  },
  {
    name: '打开',
    order: 'user_otime',
    asc: 1,
    typeIcon: I.SORT_OPENED,
    icon: I.SORT_OPENED_ASC,
  },
  {
    name: '名称',
    order: 'file_name',
    asc: 1,
    typeIcon: I.SORT_NAME,
    icon: I.SORT_NAME_ASC,
  },
  {
    name: '大小',
    order: 'file_size',
    asc: 1,
    typeIcon: I.SORT_SIZE,
    icon: I.SORT_SIZE_ASC,
  },
  {
    name: '创建',
    order: 'user_ptime',
    asc: 0,
    typeIcon: I.SORT_CREATED,
    icon: I.SORT_CREATED_DESC,
  },
  {
    name: '修改',
    order: 'user_utime',
    asc: 0,
    typeIcon: I.SORT_UPDATED,
    icon: I.SORT_UPDATED_DESC,
  },
  {
    name: '打开',
    order: 'user_otime',
    asc: 0,
    typeIcon: I.SORT_OPENED,
    icon: I.SORT_OPENED_DESC,
  },
  {
    name: '名称',
    order: 'file_name',
    asc: 0,
    typeIcon: I.SORT_NAME,
    icon: I.SORT_NAME_DESC,
  },
  {
    name: '大小',
    order: 'file_size',
    asc: 0,
    typeIcon: I.SORT_SIZE,
    icon: I.SORT_SIZE_DESC,
  },
]
