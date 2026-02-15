import type { Component, VNode } from 'vue'
import { useMagicKeys } from '@vueuse/core'
import { computed, defineComponent, h, isVNode, ref, watch } from 'vue'

const DialogModal = defineComponent({
  name: 'DialogModal',
  props: {
    id: { type: String, required: true },
    title: { type: String, default: undefined },
    content: { type: [String, Object, Function], default: undefined },
    confirmText: { type: String, default: undefined },
    cancelText: { type: String, default: undefined },
    showConfirm: { type: Boolean, default: true },
    showCancel: { type: Boolean, default: false },
    visible: { type: Boolean, default: false },
    maskClosable: { type: Boolean, default: true },
    className: { type: String, default: undefined },
    classNameRoot: { type: String, default: undefined },
    classNameTitle: { type: String, default: undefined },
    classNameContent: { type: String, default: undefined },
    classNameActions: { type: String, default: undefined },
    confirmCallback: { type: Function, default: undefined },
    cancelCallback: { type: Function, default: undefined },
    openedCallback: { type: Function, default: undefined },
  },
  emits: ['confirm', 'cancel', 'close', 'opened'],
  setup(props, { emit, slots }) {
    const modalRef = ref<HTMLElement>()

    const isRenderFunction = computed(() => typeof props.content === 'function')

    const isComponentContent = computed(() => {
      return props.content && typeof props.content === 'object' && !isVNode(props.content) && typeof props.content !== 'function'
    })

    const hasContent = computed(() => {
      return props.content !== undefined || !!slots.default || isRenderFunction.value
    })

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
      emit('close')
    }

    function handleCancel() {
      emit('cancel')
      emit('close')
    }

    const keys = useMagicKeys()
    watch(keys.Escape, (value) => {
      if (value)
        handleCancel()
    })

    return () => {
      const modalClass = props.visible
        ? `modal modal-bottom sm:modal-middle [scrollbar-gutter:unset] p-0! modal-open ${props.classNameRoot || ''}`
        : `modal modal-bottom sm:modal-middle [scrollbar-gutter:unset] p-0! ${props.classNameRoot || ''}`

      const modalBoxClass = `modal-box flex flex-col backdrop-blur-2xl bg-base-200 p-0! ${props.className || ''}`
      const titleClass = `sticky top-0 z-10 text-lg font-bold p-6 pb-4 bg-base-200/5 backdrop-blur-2xl ${props.classNameTitle || ''}`
      const contentClass = `py-2 text-base-content/80 px-6 flex-1 ${props.classNameContent || ''}`
      const actionsClass = `modal-action sticky bottom-0 p-6 ${props.classNameActions || ''}`

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
            {(props.title || slots.title) && (
              <h3 class={titleClass}>
                {slots.title ? slots.title() : props.title}
              </h3>
            )}

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
                        <button class="btn btn-ghost" onClick={handleCancel}>
                          {props.cancelText || '取消'}
                        </button>
                      )}
                      {props.showConfirm && (
                        <button class="btn btn-primary" onClick={handleConfirm}>
                          {props.confirmText || '确认'}
                        </button>
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
