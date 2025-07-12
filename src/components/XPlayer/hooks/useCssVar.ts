import type { PlayerContext } from './usePlayerProvide'
import { useCssVar as useCssVarCore } from '@vueuse/core'

/**
 * 使用 css 变量
 */
export function useCssVar(ctx: PlayerContext) {
  const prefix = '--x-player'

  const keys = {
    safeAreaBottom: `${prefix}-safe-area-bottom`,
  }

  const safeAreaBottom = useCssVarCore(keys.safeAreaBottom, ctx.refs.rootRef, {
    initialValue: '0px',
  })

  return {
    safeAreaBottom,
    keys,
  }
}
