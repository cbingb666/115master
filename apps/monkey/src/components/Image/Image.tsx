import type { PropType, StyleValue, VNode } from 'vue'
import type { ImageLoader, ImageResource } from '@/utils/imageLoader'
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import LoadingError from '../LoadingError/LoadingError'

type Fit = 'cover' | 'contain'
type LoadState = 'loading' | 'error' | 'success'

/**
 * 通用图片加载组件：骨架 → 成功 / 错误回退三态。
 * 形状/尺寸/圆角由根容器 class 控制，img 保持在文档流中提供固有尺寸；
 * img 上的响应式 fit / object-position / hover transform 通过 imgClass 传入。
 * 默认原生 <img> 加载；特殊来源通过 loader seam 注入，组件不依赖具体请求实现。
 */
const Image = defineComponent({
  name: 'Image',
  inheritAttrs: false,
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    fit: { type: String as PropType<Fit>, default: 'cover' },
    imgClass: { type: String, default: '' },
    lazy: { type: Boolean, default: false },
    draggable: { type: Boolean, default: true },
    loader: { type: Object as PropType<ImageLoader>, default: undefined },
    fallback: { type: [Object, Function] as PropType<VNode | (() => VNode)>, default: undefined },
  },
  setup(props, { attrs }) {
    const root = ref<HTMLElement>()
    const state = ref<LoadState>('loading')
    const displaySrc = ref('')
    const visible = ref(!props.lazy || typeof IntersectionObserver === 'undefined')
    let controller: AbortController | undefined
    let observer: IntersectionObserver | undefined
    let current: ImageResource | undefined
    let version = 0

    /** class/style 留根 div，其余（draggable/事件/data-*）透传到 img */
    const imgAttrs = computed(() =>
      Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style')),
    )

    function dispose(resource?: ImageResource) {
      try {
        resource?.dispose?.()
      }
      catch {
        // 资源清理失败不应阻断图片状态转换
      }
    }

    function clear() {
      version += 1
      controller?.abort()
      controller = undefined
      dispose(current)
      current = undefined
      displaySrc.value = ''
    }

    async function load() {
      clear()
      const id = version
      const url = props.src
      if (!url) {
        state.value = 'error'
        return
      }
      state.value = 'loading'
      if (props.loader && props.lazy && !visible.value)
        return

      controller = new AbortController()
      try {
        const result = props.loader
          ? await props.loader.load(url, controller.signal)
          : { src: url }
        if (id !== version || controller.signal.aborted) {
          dispose(result)
          return
        }
        if (!result.src) {
          dispose(result)
          state.value = 'error'
          return
        }
        current = result
        displaySrc.value = result.src
      }
      catch {
        if (id !== version || controller.signal.aborted)
          return
        state.value = 'error'
      }
    }

    function observe() {
      observer?.disconnect()
      observer = undefined
      if (!props.lazy || typeof IntersectionObserver === 'undefined') {
        visible.value = true
        return
      }
      visible.value = false
      if (!props.loader || !root.value)
        return
      observer = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting))
          return
        visible.value = true
        observer?.disconnect()
        observer = undefined
      })
      observer.observe(root.value)
    }

    watch(
      [() => props.src, () => props.loader?.key, visible],
      load,
      { immediate: true },
    )
    watch([() => props.lazy, () => Boolean(props.loader)], observe)
    onMounted(observe)
    onUnmounted(() => {
      observer?.disconnect()
      clear()
    })

    function resolveFallback() {
      const f = props.fallback
      if (!f)
        return <LoadingError message="图片加载失败" size="mini" showDetailButton={false} />
      return typeof f === 'function' ? f() : f
    }

    return () => {
      const fitClass = props.fit === 'contain' ? 'object-contain' : 'object-cover'
      const label = state.value === 'error'
        ? `${props.alt || '图片'}加载失败`
        : !displaySrc.value && props.alt
            ? props.alt
            : undefined
      return (
        <div
          ref={root}
          class={['relative overflow-hidden', attrs.class]}
          style={attrs.style as StyleValue}
          role={label ? 'img' : undefined}
          aria-label={label}
          aria-busy={state.value === 'loading' ? 'true' : undefined}
        >
          {state.value === 'loading' && (
            <div aria-hidden="true" class="skeleton ui-z-cover absolute inset-0 h-full w-full rounded-[inherit]" />
          )}
          {state.value === 'error'
            ? <div class="h-full w-full">{resolveFallback()}</div>
            : displaySrc.value && (
              <img
                key={displaySrc.value}
                {...imgAttrs.value}
                src={displaySrc.value}
                alt={props.alt}
                draggable={props.draggable}
                data-origin-src={props.src}
                class={['block h-full w-full', fitClass, props.imgClass]}
                loading={props.lazy ? 'lazy' : 'eager'}
                decoding="async"
                onLoad={() => { state.value = 'success' }}
                onError={() => {
                  dispose(current)
                  current = undefined
                  displaySrc.value = ''
                  state.value = 'error'
                }}
              />
            )}
        </div>
      )
    }
  },
})

export default Image
