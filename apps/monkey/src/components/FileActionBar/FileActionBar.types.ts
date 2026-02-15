import type { Action } from '@/types/action'

export interface ActionBarItemState {
  /** 是否加载中 */
  isLoading: boolean
}

export interface ActionBarItem extends Action {}
