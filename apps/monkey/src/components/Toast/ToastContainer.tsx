import type { ToastContainerExpose, ToastContainerProps, ToastContainerSlots, ToastProps } from './types'
import { computed, defineComponent, ref } from 'vue'
import { useToastContainerProvide } from './provide'
import { Toast } from './Toast'

export const ToastContainer = defineComponent({
  name: 'ToastContainer',
  props: {
    position: {
      type: String as () => ToastContainerProps['position'],
      default: 'top-right',
    },
    maxCount: {
      type: Number,
      default: 5,
    },
    className: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots }: { slots: ToastContainerSlots }) {
    const toasts = ref<ToastProps[]>([])
    const containerRef = ref<HTMLDivElement>()

    function addToast(toast: ToastProps) {
      if (props.maxCount > 0 && toasts.value.length >= props.maxCount) {
        const oldestToast = toasts.value[0]
        removeToast(oldestToast.id)
      }
      toasts.value.push(toast)
    }

    function removeToast(id: string) {
      const index = toasts.value.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }

    function clearToasts() {
      toasts.value = []
    }

    function updateToast(id: string, updates: Partial<ToastProps>) {
      const index = toasts.value.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.value[index] = { ...toasts.value[index], ...updates }
      }
    }

    function handleClose(toast: ToastProps) {
      toast.closeCallback?.()
      const index = toasts.value.findIndex(t => t.id === toast.id)
      if (index > -1) {
        toasts.value[index].visible = false
        setTimeout(() => {
          removeToast(toast.id)
        }, 300)
      }
    }

    const expose: ToastContainerExpose = {
      addToast,
      removeToast,
      clearToasts,
      updateToast,
    }

    useToastContainerProvide(expose)

    const positionClass = computed(() => {
      const positionMap: Record<NonNullable<ToastContainerProps['position']>, string> = {
        'top-left': 'top-0 left-0 items-start',
        'top-right': 'top-0 right-0 items-end',
        'bottom-left': 'bottom-0 left-0 items-start',
        'bottom-right': 'bottom-0 right-0 items-end',
        'top-center': 'top-0 left-1/2 -translate-x-1/2 items-center',
        'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 items-center',
      }
      return positionMap[props.position ?? 'top-right']
    })

    return () => (
      <>
        {slots.default?.()}
        <div
          ref={containerRef}
          class={`
            pointer-events-none fixed z-10000
            flex transform flex-col gap-2
            p-4
            ${positionClass.value}
            ${props.className}
          `}
        >
          {toasts.value.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => handleClose(toast)}
            />
          ))}
        </div>
      </>
    )
  },
})
