import { defineComponent, ref, watch } from 'vue'
import { LoadingError } from '@/components'
import { imageCache } from '@/utils/cache/imageCache'
import { blobToBase64, compressImage } from '@/utils/image'
import { GMRequest } from '@/utils/request/gmRequst'

const Image = defineComponent({
  name: 'Image',
  props: {
    referer: {
      type: String,
      default: '',
    },
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: '',
    },
    skeletonMode: {
      type: String as () => 'light' | 'dark',
      default: 'light',
    },
    cache: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { attrs }) {
    const src = ref<string>()
    const loading = ref(false)
    const error = ref(false)
    const gmRequst = new GMRequest()

    async function getImageByGmRequest(src: string): Promise<Base64URLString> {
      if (props.cache) {
        const cache = await imageCache.get(src)
        if (cache) {
          return await blobToBase64(cache.value)
        }
      }
      const res = await gmRequst.get(src, {
        headers: {
          ...(props.referer ? { Referer: props.referer } : {}),
        },
        responseType: 'blob',
      })
      const blob = new Blob([await res.blob()], { type: 'image/jpeg' })
      const compressedBlob = await compressImage(blob, {
        maxWidth: 720,
        maxHeight: 720,
        quality: 0.8,
        type: 'image/webp',
      })
      props.cache && imageCache.set(props.src, compressedBlob)
      return await blobToBase64(compressedBlob)
    }

    async function loadImage(_src: string) {
      try {
        loading.value = true
        if (props.referer) {
          const result = await getImageByGmRequest(_src)
          src.value = result
        }
        else {
          src.value = _src
        }
      }
      catch {
        src.value = ''
        error.value = true
      }
      finally {
        loading.value = false
      }
    }

    watch(
      () => props.src,
      async (newVal) => {
        if (newVal) {
          loadImage(newVal)
        }
        else {
          src.value = ''
        }
      },
      { immediate: true },
    )

    return () => (
      <div class="flex h-full w-full items-center justify-center">
        {loading.value
          ? (
              <div class="skeleton h-full w-full rounded" />
            )
          : error.value
            ? (
                <LoadingError />
              )
            : (
                <img
                  src={src.value}
                  data-origin-src={props.src}
                  data-referer={props.referer}
                  class="h-full w-full rounded object-cover"
                  {...attrs}
                />
              )}
      </div>
    )
  },
})

export default Image
