import type { PropType } from 'vue'
import type { ToastProps, ToastSlots } from './types'
import { computed, defineComponent, isVNode, onMounted, onUnmounted, ref } from 'vue'
import { I, Icon } from '@/icons'

export const Toast = defineComponent({
  name: 'Toast',
  props: {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    content: {
      type: [String, Object, Function] as PropType<ToastProps['content']>,
      default: '',
    },
    type: {
      type: String as PropType<ToastProps['type']>,
      default: 'info',
    },
    duration: {
      type: Number,
      default: 3000,
    },
    closable: {
      type: Boolean,
      default: true,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    className: {
      type: String,
      default: '',
    },
  },
  emits: ['close'] as const,
  setup(props, { emit, slots }: { emit: (event: 'close', id: string) => void, slots: ToastSlots }) {
    const timer = ref<NodeJS.Timeout | null>(null)

    const isRenderFunction = computed(() => {
      return typeof props.content === 'function'
    })

    const isComponentContent = computed(() => {
      return props.content && typeof props.content === 'object' && !isVNode(props.content) && typeof props.content !== 'function'
    })

    const renderComponent = computed(() => {
      if (!isRenderFunction.value)
        return null

      return defineComponent({
        name: 'ToastRenderContent',
        render() {
          try {
            const renderFn = props.content as () => any
            return renderFn()
          }
          catch (error) {
            console.error('Error rendering function content:', error)
            return '渲染错误'
          }
        },
      })
    })

    const typeClassMap: Record<NonNullable<ToastProps['type']>, string> = {
      success: 'alert-success',
      error: 'alert-error',
      warning: 'alert-warning',
      info: 'alert-info',
    }

    function getTypeClass(type: ToastProps['type']) {
      return typeClassMap[type ?? 'info']
    }

    function handleClose() {
      emit('close', props.id)
    }

    function handleToastClick(event: MouseEvent) {
      if ((event.target as HTMLElement).closest('[data-close]')) {
        return
      }
      console.debug('Toast clicked:', event)
    }

    function startTimer() {
      if (props.duration > 0) {
        timer.value = setTimeout(() => {
          handleClose()
        }, props.duration)
      }
    }

    function clearTimer() {
      if (timer.value) {
        clearTimeout(timer.value)
        timer.value = null
      }
    }

    onMounted(() => {
      startTimer()
    })

    onUnmounted(() => {
      clearTimer()
    })

    const toastClass = computed(() => {
      const baseClass = `
        alert ui-glass-floating mb-3
        app-animate-slide-in-right
        transition-all duration-300
        flex items-center
        min-w-80 max-w-md
        cursor-pointer
        rounded-3xl
        px-4 py-3
        relative z-50
        pointer-events-auto
        ${getTypeClass(props.type)}
        ${props.className}
      `
      return baseClass.replace(/\s+/g, ' ').trim()
    })

    const typeIconMap: Record<NonNullable<ToastProps['type']>, typeof I[keyof typeof I]> = {
      success: I.TOAST_SUCCESS,
      error: I.TOAST_ERROR,
      warning: I.TOAST_WARNING,
      info: I.TOAST_INFO,
    }

    const currentIcon = computed(() => typeIconMap[props.type ?? 'info'])

    return () => (
      <div class={toastClass.value} onClick={handleToastClick}>
        <div class="mr-3 size-7 flex-none shrink-0">
          {slots.icon
            ? slots.icon()
            : <Icon name={currentIcon.value} class="size-7" />}
        </div>

        <div class="min-w-0 flex-1">
          {(props.title || slots.title) && (
            <div class="mb-1 text-base leading-tight font-semibold">
              {slots.title
                ? slots.title()
                : props.title}
            </div>
          )}

          <div class="text-sm leading-relaxed wrap-break-word opacity-90">
            {slots.default
              ? slots.default()
              : isComponentContent.value
                ? <component is={props.content} />
                : isRenderFunction.value
                  ? <component is={renderComponent.value} />
                  : props.content}
          </div>
        </div>

        {props.closable && (
          <div
            class="
              relative z-10
              ml-3
              flex-none
              shrink-0
              cursor-pointer
              rounded-lg transition-all
              duration-200
              hover:scale-110 hover:bg-black/10
            "
            onClick={(e: Event) => {
              e.stopPropagation()
              handleClose()
            }}
          >
            <Icon name={I.TOAST_CLOSE} class="size-8" />
          </div>
        )}
      </div>
    )
  },
})
