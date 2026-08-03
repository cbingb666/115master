import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import {
  defineComponent,
  onBeforeUnmount,
  shallowRef,
  Transition,
  watch,
} from 'vue'
import { Button } from '../Button/Button'
import { scrollbar } from '../Scrollbar/Scrollbar'

export type NavigationStackPageKey = string | number
export type NavigationStackDirection = 'forward' | 'back' | 'replace'

const props = {
  title: {
    type: String,
    required: true,
  },
  pageKey: {
    type: [String, Number] as PropType<NavigationStackPageKey>,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
    validator: (value: number) => Number.isInteger(value) && value >= 0,
  },
  canGoBack: {
    type: Boolean,
    default: false,
  },
  backLabel: {
    type: String,
    default: undefined,
  },
  closeLabel: {
    type: String,
    required: true,
  },
} as const

export type NavigationStackProps = ExtractPublicPropTypes<typeof props>

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

/** Controlled content navigation that can fill either a Dialog or a Drawer. */
export const NavigationStack = defineComponent({
  name: 'NavigationStack',

  props,

  emits: {
    back: () => true,
    dismiss: () => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    actions?: () => VNodeChild
  }>,

  setup(props, { emit, slots }) {
    const direction = shallowRef<NavigationStackDirection>('replace')
    const content = shallowRef<HTMLElement>()
    let height: number | undefined
    let frame: number | undefined

    function bottom() {
      return !!content.value?.closest('[data-ui-drawer-placement="bottom"]')
    }

    function resized() {
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
        frame = undefined
      }
      content.value?.style.removeProperty('height')
      height = undefined
    }

    function resize(element: Element) {
      const container = content.value

      if (!container || height === undefined || !bottom())
        return

      container.style.height = `${Math.ceil(height)}px`
      container.getBoundingClientRect()
      frame = requestAnimationFrame(() => {
        frame = undefined

        if (content.value !== container)
          return
        container.style.height = `${Math.ceil((element as HTMLElement).scrollHeight)}px`
      })
    }

    watch(
      () => [props.pageKey, props.depth] as const,
      ([pageKey, depth], [previousPageKey, previousDepth]) => {
        if (Object.is(pageKey, previousPageKey) && depth === previousDepth)
          return

        height = bottom() ? content.value?.getBoundingClientRect().height : undefined
        direction.value = depth > previousDepth
          ? 'forward'
          : depth < previousDepth
            ? 'back'
            : 'replace'
      },
      { flush: 'sync' },
    )

    onBeforeUnmount(resized)

    return () => {
      const title = props.title.trim()
      const close = props.closeLabel.trim()
      const back = props.backLabel?.trim()

      if (!title)
        throw new Error('NavigationStack requires a non-empty title.')
      if (!close)
        throw new Error('NavigationStack requires a non-empty closeLabel.')
      if (props.canGoBack && !back)
        throw new Error('NavigationStack requires backLabel when canGoBack is true.')

      return (
        <div
          class="ui-navigation-stack"
          data-ui-navigation-stack=""
          data-ui-navigation-direction={direction.value}
        >
          <header class="ui-navigation-stack__header">
            <div class="ui-navigation-stack__leading">
              <Transition name="ui-navigation-stack-back">
                {props.canGoBack && (
                  <Button
                    key="back"
                    variant="ghost"
                    shape="square"
                    aria-label={back}
                    title={back}
                    onClick={() => emit('back')}
                  >
                    <BackIcon />
                  </Button>
                )}
              </Transition>
            </div>

            <div class="ui-navigation-stack__titles">
              <Transition name={`ui-navigation-stack-title-${direction.value}`}>
                <h2 key={props.pageKey} class="ui-navigation-stack__title">{title}</h2>
              </Transition>
            </div>

            <Button
              variant="ghost"
              shape="square"
              aria-label={close}
              title={close}
              onClick={() => emit('dismiss')}
            >
              <CloseIcon />
            </Button>
          </header>

          {slots.default && (
            <div ref={content} class={['ui-navigation-stack__content', ...scrollbar()]}>
              <Transition
                name={`ui-navigation-stack-page-${direction.value}`}
                onBeforeEnter={resize}
                onAfterEnter={resized}
                onEnterCancelled={resized}
              >
                <div key={props.pageKey} class="ui-navigation-stack__page">
                  {slots.default()}
                </div>
              </Transition>
            </div>
          )}

          {slots.actions && (
            <footer class="ui-navigation-stack__actions">
              {slots.actions()}
            </footer>
          )}
        </div>
      )
    }
  },
})
