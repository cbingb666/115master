import type { PropType, VNode } from 'vue'
import { image as imageUtil } from '@115master/utils'
import { computed, defineComponent, ref, watch } from 'vue'
// 深路径：经 @/components barrel 会形成 Image → barrel → Image 循环（dev not defined）
import { LoadingError } from '@/components/LoadingError'
import { imageCache } from '@/utils/cache/imageCache'
import { GMRequest } from '@/utils/request/gmRequest'

type Fit = 'cover' | 'contain'
type LoadState = 'loading' | 'error' | 'success'

/**
 * 通用图片加载组件：骨架 → 成功 / 错误回退三态。
 * 形状/尺寸/圆角由根容器 class 控制（overflow-hidden 裁剪内部 absolute 元素）；
 * img 上的响应式 fit / object-position / hover transform 通过 imgClass 传入。
 * 默认原生 <img> 加载；传 referer 时走 GMRequest+压缩+缓存（防盗链远程图）。
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
    referer: { type: String, default: '' },
    cache: { type: Boolean, default: true },
    fallback: { type: [Object, Function] as PropType<VNode | (() => VNode)>, default: undefined },
  },
  setup(props, { attrs }) {
    const state = ref<LoadState>('loading')
    const displaySrc = ref('')
    const gm = new GMRequest()

    /** class/style 留根 div，其余（draggable/事件/data-*）透传到 img */
    const imgAttrs = computed(() =>
      Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style')),
    )

    async function viaGM(url: string) {
      if (props.cache) {
        const hit = await imageCache.get(url)
        if (hit)
          return await imageUtil.blobToBase64(hit.value)
      }
      const res = await gm.get(url, {
        headers: props.referer ? { Referer: props.referer } : {},
        responseType: 'blob',
      })
      const blob = new Blob([await res.blob()], { type: 'image/jpeg' })
      const compressed = await imageUtil.compress(blob, {
        maxWidth: 720,
        maxHeight: 720,
        quality: 0.8,
        type: 'image/webp',
      })
      if (props.cache)
        imageCache.set(url, compressed)
      return await imageUtil.blobToBase64(compressed)
    }

    async function load(url: string) {
      if (!url) {
        // 空 src 直接回退，不卡骨架
        state.value = 'error'
        displaySrc.value = ''
        return
      }
      state.value = 'loading'
      try {
        displaySrc.value = props.referer ? await viaGM(url) : url
      }
      catch {
        state.value = 'error'
        displaySrc.value = ''
      }
    }

    watch(() => props.src, load, { immediate: true })

    function resolveFallback() {
      const f = props.fallback
      if (!f)
        return <LoadingError size="mini" />
      return typeof f === 'function' ? f() : f
    }

    return () => {
      const fitClass = props.fit === 'contain' ? 'object-contain' : 'object-cover'
      return (
        <div class={['relative overflow-hidden', attrs.class]}>
          {state.value === 'loading' && <div class="skeleton absolute inset-0 h-full w-full" />}
          {state.value === 'error'
            ? resolveFallback()
            : displaySrc.value && (
              <img
                {...imgAttrs.value}
                src={displaySrc.value}
                alt={props.alt}
                draggable={props.draggable}
                data-origin-src={props.src}
                data-referer={props.referer}
                class={['absolute inset-0 h-full w-full', fitClass, props.imgClass]}
                loading={props.lazy ? 'lazy' : 'eager'}
                decoding={props.lazy ? 'async' : 'sync'}
                onLoad={() => { state.value = 'success' }}
                onError={() => { state.value = 'error' }}
              />
            )}
        </div>
      )
    }
  },
})

export default Image
