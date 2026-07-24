import type { Component, PropType, VNode } from 'vue'
import type { DialogSize } from './types.dialog'
import { computed, defineComponent, h, isVNode, ref } from 'vue'
import Button from '../Button/Button'
import DialogTitle from './DialogTitle'

/** 各档基准尺寸类；md 留空以沿用 modal-box 默认的 max-w-lg，保证 alert 视觉不变 */
const SIZE_CLASS: Record<DialogSize, string> = {
  md: '',
  lg: 'sm:max-w-3xl!',
  xl: 'sm:max-w-6xl! h-5/6! overflow-hidden',
  full: 'sm:w-11/12! h-7/8! overflow-hidden',
}

const DialogModal = defineComponent({
  name: 'DialogModal',
  props: {
    id: { type: String, required: true },
    title: { type: [String, Object, Function], default: undefined },
    content: { type: [String, Object, Function], default: undefined },
    confirmText: { type: [String, Object, Function], default: undefined },
    cancelText: { type: [String, Object, Function], default: undefined },
    showConfirm: { type: Boolean, default: true },
    showCancel: { type: Boolean, default: true },
    visible: { type: Boolean, default: false },
    maskClosable: { type: Boolean, default: true },
    size: { type: String as PropType<DialogSize>, default: 'md' },
    className: { type: String, default: undefined },
    classNameRoot: { type: String, default: undefined },
    classNameTitle: { type: String, default: undefined },
    classNameContent: { type: String, default: undefined },
    classNameActions: { type: String, default: undefined },
    confirmCallback: { type: Function, default: undefined },
    cancelCallback: { type: Function, default: undefined },
    openedCallback: { type: Function, default: undefined },
    titleActions: { type: Function, default: undefined },
  },
  emits: ['confirm', 'cancel', 'close', 'opened'],
  setup(props, { emit, slots }) {
    const modalRef = ref<HTMLElement>()

    const isRenderFunction = computed(() => typeof props.content === 'function')

    function renderNode(value: unknown, fallback: string) {
      if (value === undefined || value === null)
        return fallback
      if (typeof value === 'function')
        return (value as () => VNode)()
      if (isVNode(value))
        return value
      return value as string
    }

    const isComponentContent = computed(() => {
      return props.content && typeof props.content === 'object' && !isVNode(props.content) && typeof props.content !== 'function'
    })

    const hasContent = computed(() => {
      return props.content !== undefined || !!slots.default || isRenderFunction.value
    })

    /** 无 title 时不再渲染空 DialogTitle，避免内容区自带头部时叠出一条空白 */
    const hasTitle = computed(() => !!props.title || !!props.titleActions || !!slots.title)

    function handleTransitionEnd(event: TransitionEvent) {
      if (event.target === modalRef.value && props.visible) {
        emit('opened')
      }
    }

    function handleMaskClick(event: MouseEvent) {
      if (props.maskClosable && event.target === event.currentTarget) {
        handleCancel()
      }
    }

    function handleConfirm() {
      emit('confirm')
    }

    function handleCancel() {
      emit('cancel')
      emit('close')
    }

    return () => {
      const modalClass = props.visible
        ? `modal modal-bottom sm:modal-middle [scrollbar-gutter:unset] p-0! modal-open ${props.classNameRoot || ''}`
        : `modal modal-bottom sm:modal-middle [scrollbar-gutter:unset] p-0! ${props.classNameRoot || ''}`

      const modalBoxClass = `modal-box app-glass-panel flex flex-col p-0! ${SIZE_CLASS[props.size]} ${props.className || ''}`
      const contentClass = `text-base-content/80 px-4 flex-1 ${props.classNameContent || ''}`
      const actionsClass = `modal-action sticky bottom-0 px-4 pb-4 mt-4 ${props.classNameActions || ''}`

      const renderContent = () => {
        if (slots.default) {
          return slots.default()
        }
        if (isComponentContent.value) {
          const ContentComponent = props.content as Component
          return h(ContentComponent)
        }
        if (isRenderFunction.value) {
          try {
            const renderFn = props.content as () => VNode
            return renderFn()
          }
          catch (error) {
            console.error('Error rendering function content:', error)
            return '渲染错误'
          }
        }
        return props.content
      }

      return (
        <div
          id={props.id}
          ref={modalRef}
          class={modalClass}
          onClick={handleMaskClick}
          onTransitionend={handleTransitionEnd}
        >
          <div class={modalBoxClass} onClick={(e: Event) => e.stopPropagation()}>
            {hasTitle.value && (slots.title
              ? (
                  <DialogTitle
                    title={props.title}
                    className={props.classNameTitle}
                    v-slots={{ titleActions: () => props.titleActions?.() }}
                  >
                    {slots.title()}
                  </DialogTitle>
                )
              : (
                  <DialogTitle
                    title={props.title}
                    className={props.classNameTitle}
                    v-slots={{ titleActions: () => props.titleActions?.() }}
                  />
                ))}

            {hasContent.value && (
              <div class={contentClass}>
                {renderContent()}
              </div>
            )}

            <div class={actionsClass}>
              {slots.actions
                ? (
                    slots.actions()
                  )
                : (
                    <>
                      {props.showCancel && (
                        <Button color="neutral" class="max-sm:flex-1" onClick={handleCancel}>
                          {renderNode(props.cancelText, '取消')}
                        </Button>
                      )}
                      {props.showConfirm && (
                        <Button color="primary" class="max-sm:flex-1" onClick={handleConfirm}>
                          {renderNode(props.confirmText, '确认')}
                        </Button>
                      )}
                    </>
                  )}
            </div>
          </div>
        </div>
      )
    }
  },
})

export default DialogModal
