import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import { defineComponent } from 'vue'
import { Button } from '../Button/Button'
import { Header } from '../Header/Header'
import { HeaderEnd } from '../Header/HeaderEnd'
import { HeaderStart } from '../Header/HeaderStart'
import { Tooltip } from '../Tooltip/Tooltip'

const props = {
  count: {
    type: Number,
    required: true,
  },
  countLabel: {
    type: String,
    required: true,
  },
  exitLabel: {
    type: String,
    required: true,
  },
  onExit: {
    type: Function as PropType<() => void>,
    required: true,
  },
  selectAllLabel: {
    type: String,
    default: undefined,
  },
  onSelectAll: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  invertLabel: {
    type: String,
    default: undefined,
  },
  onInvert: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
} as const

export type SelectionHeaderProps = ExtractPublicPropTypes<typeof props>

/**
 * An application-agnostic selection-mode header. Callers own labels, icons
 * and selection state; optional actions are rendered when their callbacks are
 * provided.
 */
export const SelectionHeader = defineComponent({
  name: 'SelectionHeader',

  props,

  slots: Object as SlotsType<{
    exitIcon?: () => VNodeChild
    selectAllIcon?: () => VNodeChild
    invertIcon?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    return () => {
      const count = props.countLabel.trim()
      const exit = props.exitLabel.trim()
      const selectAll = props.selectAllLabel?.trim()
      const invert = props.invertLabel?.trim()

      if (!count)
        throw new Error('SelectionHeader requires a non-empty countLabel.')
      if (!exit)
        throw new Error('SelectionHeader requires a non-empty exitLabel.')
      if (props.onSelectAll && !selectAll)
        throw new Error('SelectionHeader requires selectAllLabel when onSelectAll is provided.')
      if (props.onInvert && !invert)
        throw new Error('SelectionHeader requires invertLabel when onInvert is provided.')

      return (
        <Header data-ui-selection-header="">
          <HeaderStart>
            <Button
              class="rounded-full"
              variant="glass-floating"
              title={exit}
              aria-label={exit}
              onClick={() => props.onExit()}
            >
              {slots.exitIcon?.()}
              <span class="tabular-nums" aria-live="polite">
                {props.count}
                {' '}
                {count}
              </span>
            </Button>
          </HeaderStart>
          <HeaderEnd>
            {props.onSelectAll && (
              <Tooltip content={selectAll}>
                <Button
                  variant="glass-floating"
                  shape="circle"
                  title={selectAll}
                  aria-label={selectAll}
                  onClick={() => props.onSelectAll?.()}
                >
                  {slots.selectAllIcon?.()}
                </Button>
              </Tooltip>
            )}
            {props.onInvert && (
              <Tooltip content={invert}>
                <Button
                  variant="glass-floating"
                  shape="circle"
                  title={invert}
                  aria-label={invert}
                  onClick={() => props.onInvert?.()}
                >
                  {slots.invertIcon?.()}
                </Button>
              </Tooltip>
            )}
          </HeaderEnd>
        </Header>
      )
    }
  },
})
