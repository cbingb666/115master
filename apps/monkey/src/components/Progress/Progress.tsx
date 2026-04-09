import { defineComponent, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

export const Progress = defineComponent({
  name: 'Progress',

  props: {
    active: {
      type: Boolean,
      default: true,
    },
  },

  setup(props) {
    const bar = shallowRef<HTMLElement>()
    const frame = shallowRef(0)
    const base = shallowRef(0)
    const timer = shallowRef(0)
    const show = shallowRef(props.active)

    function run(ts: number) {
      if (!base.value)
        base.value = ts

      const span = 1400
      const p = ((ts - base.value) % span) / span
      const x = -35 + p * 170

      if (bar.value)
        bar.value.style.transform = `translate3d(${x}%, 0, 0)`

      frame.value = requestAnimationFrame(run)
    }

    function stop() {
      cancelAnimationFrame(frame.value)
      frame.value = 0
    }

    function start() {
      stop()
      base.value = 0
      if (bar.value) {
        bar.value.style.opacity = '1'
        bar.value.style.transition = 'none'
        bar.value.style.transform = 'translate3d(-35%, 0, 0)'
      }
      frame.value = requestAnimationFrame(run)
    }

    function leave() {
      stop()
      if (bar.value) {
        bar.value.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease'
        bar.value.style.transform = 'translate3d(130%, 0, 0)'
        bar.value.style.opacity = '0'
      }
      clearTimeout(timer.value)
      timer.value = window.setTimeout(() => {
        show.value = false
      }, 320)
    }

    onMounted(() => {
      if (props.active)
        start()
    })

    watch(() => props.active, (v) => {
      if (v) {
        show.value = true
        start()
        return
      }
      leave()
    })

    onBeforeUnmount(() => {
      stop()
      clearTimeout(timer.value)
    })

    return () => {
      if (!show.value)
        return null

      return (
        <div class="bg-base-300/35 pointer-events-none fixed inset-x-0 top-0 z-9999 h-0.5 overflow-hidden">
          <div
            ref={bar}
            class="h-full w-1/3 rounded-full will-change-transform"
            style="transform: translate3d(-35%, 0, 0); background: var(--color-primary); box-shadow: 0 0 10px color-mix(in oklab, var(--color-primary) 60%, transparent);"
          />
        </div>
      )
    }
  },
})

export default Progress
