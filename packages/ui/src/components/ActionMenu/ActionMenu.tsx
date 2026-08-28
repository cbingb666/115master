import type {
  ExtractPublicPropTypes,
  MaybeRefOrGetter,
  PropType,
  VNodeChild,
} from 'vue'
import type {
  ContextMenuCloseReason,
  ContextMenuMaterial,
  ContextMenuPosition,
  ContextMenuTarget,
} from '../ContextMenu/ContextMenu'
import { defineComponent, Fragment, toValue } from 'vue'
import { ContextMenu } from '../ContextMenu/ContextMenu'

export type ActionMenuTone = 'default' | 'primary' | 'destructive'

export interface ActionMenuItem {
  id: string
  label: MaybeRefOrGetter<string>
  leading?: () => VNodeChild
  hint?: MaybeRefOrGetter<string | undefined>
  visible?: MaybeRefOrGetter<boolean>
  disabled?: MaybeRefOrGetter<boolean>
  tone?: MaybeRefOrGetter<ActionMenuTone>
  onSelect: () => Promise<void> | void
}

export type ActionMenuGroup = readonly ActionMenuItem[]

const props = {
  open: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object as PropType<ContextMenuPosition>,
    default: () => ({ x: 0, y: 0 }),
  },
  groups: {
    type: Array as PropType<readonly ActionMenuGroup[]>,
    required: true,
  },
  material: {
    type: String as PropType<ContextMenuMaterial>,
    default: 'floating',
  },
  to: {
    type: [String, Object] as PropType<ContextMenuTarget>,
    default: undefined,
  },
} as const

export type ActionMenuProps = ExtractPublicPropTypes<typeof props>

/**
 * A data-driven action menu. It owns standard action rendering, grouping,
 * visibility, disabled state, tones and close-after-selection behavior while
 * ContextMenu owns the transient surface and interaction mechanics.
 */
export const ActionMenu = defineComponent({
  name: 'ActionMenu',

  inheritAttrs: false,

  props,

  emits: {
    'update:open': (_open: boolean) => true,
    'close': (_reason: ContextMenuCloseReason) => true,
  },

  setup(props, { attrs, emit }) {
    function select(item: ActionMenuItem) {
      const result = item.onSelect()
      emit('update:open', false)
      return result
    }

    return () => {
      const groups = props.groups
        .map(group => group.filter(item => item.visible === undefined || toValue(item.visible)))
        .filter(group => group.length > 0)

      return (
        <ContextMenu
          {...attrs}
          open={props.open}
          position={props.position}
          material={props.material}
          to={props.to}
          onUpdate:open={open => emit('update:open', open)}
          onClose={reason => emit('close', reason)}
        >
          {groups.map((group, index) => (
            <Fragment key={group.map(item => item.id).join(':')}>
              <ul data-ui-action-menu-group="" role="group">
                {group.map((item) => {
                  const hint = item.hint === undefined ? undefined : toValue(item.hint)
                  const tone = item.tone === undefined ? 'default' : toValue(item.tone)

                  return (
                    <li key={item.id} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        class={[
                          'ui-action-menu__item rounded-xl px-3',
                          tone === 'primary' ? 'text-primary' : '',
                          tone === 'destructive' ? 'text-error' : '',
                        ]}
                        data-ui-action-menu-item={item.id}
                        data-ui-action-menu-tone={tone}
                        disabled={item.disabled === undefined ? false : toValue(item.disabled)}
                        onClick={() => select(item)}
                      >
                        {item.leading && (
                          <span
                            class="ui-action-menu__leading flex size-5 shrink-0 items-center justify-center [&>*]:size-5"
                            aria-hidden="true"
                          >
                            {item.leading()}
                          </span>
                        )}
                        <span class="ui-action-menu__label flex-1">
                          {toValue(item.label)}
                        </span>
                        {hint && (
                          <span class="ui-action-menu__hint ml-4 text-xs font-medium opacity-50">
                            {hint}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {index < groups.length - 1 && (
                <hr
                  class="border-base-content/10 mx-2 my-1"
                  data-ui-action-menu-separator=""
                  role="separator"
                />
              )}
            </Fragment>
          ))}
        </ContextMenu>
      )
    }
  },
})
