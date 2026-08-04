import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import { defineComponent, Transition } from 'vue'
import { Button } from '../Button/Button'
import { Header } from '../Header/Header'
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
  allSelected: {
    type: Boolean,
    default: false,
  },
  selectAllLabel: {
    type: String,
    default: undefined,
  },
  onSelectAll: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
} as const

export type SelectionHeaderProps = ExtractPublicPropTypes<typeof props>

/**
 * An application-agnostic selection-mode header. Callers own labels, icons
 * and selection state; the optional select-all action is rendered when its
 * callback is provided and the caller has not marked the collection selected.
 */
export const SelectionHeader = defineComponent({
  name: 'SelectionHeader',

  props,

  slots: Object as SlotsType<{
    exitIcon?: () => VNodeChild
    selectAllIcon?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    return () => {
      const count = props.countLabel.trim()
      const exit = props.exitLabel.trim()
      const selectAll = props.selectAllLabel?.trim()

      if (!count)
        throw new Error('SelectionHeader requires a non-empty countLabel.')
      if (!exit)
        throw new Error('SelectionHeader requires a non-empty exitLabel.')
      if (props.onSelectAll && !selectAll)
        throw new Error('SelectionHeader requires selectAllLabel when onSelectAll is provided.')

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
            <Transition
              enterActiveClass="transition-opacity duration-150 ease-[var(--ui-ease-enter)]"
              enterFromClass="opacity-0"
              enterToClass="opacity-100"
              leaveActiveClass="transition-opacity duration-100 ease-[var(--ui-ease-exit)]"
              leaveFromClass="opacity-100"
              leaveToClass="opacity-0"
            >
              {props.onSelectAll && !props.allSelected && (
                <div key="select-all" class="flex">
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
                </div>
              )}
            </Transition>
          </HeaderStart>
        </Header>
      )
    }
  },
})
