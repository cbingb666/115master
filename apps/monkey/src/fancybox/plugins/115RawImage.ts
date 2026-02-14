import type { CarouselInstance, CarouselPlugin, CarouselSlide as CarouselSlideType } from '@fancyapps/ui/dist/fancybox'
import { isPlainObject } from 'lodash'
import { drive115 } from '@/utils/drive115Instance'

const DEFAULT_OPTIONS = {
  showLoading: true,
  preload: 3,
}

type CarouselSlide = CarouselSlideType & {
  pickcode: string
}

/**
 * 115RawImage
 * @deprecated 目前 WebApiGetFilesImage 接口在长按翻页时会触发并发限流，暂时不得使用
 * @description 加载115原始图片，并且会重写 Lazyload 实现
 * @returns 返回 Fancybox 插件
 */
export const Carousel115RawImage: CarouselPlugin = () => {
  let sliderInstance: CarouselInstance | undefined

  function getOptions() {
    const options = sliderInstance?.getOptions().Lazyload
    return isPlainObject(options)
      ? Object.assign({}, DEFAULT_OPTIONS, options)
      : DEFAULT_OPTIONS
  }

  async function processLazyElements(slide: CarouselSlide) {
    const slideEl = slide.el
    if (!slideEl)
      return

    console.log('slide', slide)
    if (slide.pickcode) {
      console.log('pickcode', slide.pickcode)
      const res = await drive115.WebApiGetFilesImage({
        pickcode: slide.pickcode,
      })
      const url = res.data.source_url
      const lazyEl = slideEl.querySelector('[data-lazy-src]')
      if (lazyEl) {
        lazyEl.setAttribute('data-lazy-src', url)
      }
    }

    const selector = '[data-lazy-src],[data-lazy-srcset],[data-lazy-bg]'
    const lazyElements = Array.from(slideEl.querySelectorAll(selector))

    if (slideEl.matches(selector)) {
      lazyElements.push(slideEl)
    }

    for (const el of lazyElements) {
      const dataSrc = (el as HTMLElement).dataset.lazySrc
      const dataSrcset = (el as HTMLElement).dataset.lazySrcset
      const dataSizes = (el as HTMLElement).dataset.lazySizes
      const dataBg = (el as HTMLElement).dataset.lazyBg

      const isImageOrSource = el instanceof HTMLImageElement || el instanceof HTMLSourceElement
      const isElementWithBg = el instanceof HTMLElement

      const hasImageSource = isImageOrSource && (dataSrc || dataSrcset)
      const hasBackground = isElementWithBg && dataBg

      if (!hasImageSource && !hasBackground)
        continue

      const lazyTarget = dataSrc || dataSrcset || dataBg

      if (hasImageSource && lazyTarget) {
        if (getOptions().showLoading) {
          sliderInstance?.showLoading(slide)
        }

        el.addEventListener('load', () => {
          sliderInstance?.hideLoading(slide)
          if (el instanceof HTMLImageElement) {
            el.decode().then(() => {
              el.classList.remove('f-lazyload')
              el.classList.add('f-lazyloaded')
            })
          }
          else {
            el.classList.remove('f-lazyload')
            el.classList.add('f-lazyloaded')
          }

          sliderInstance?.emit('lazyLoad:loaded', slide, el, lazyTarget)
        })

        el.addEventListener('error', () => {
          sliderInstance?.hideLoading(slide)
          el.classList.remove('f-lazyload')
          el.classList.add('has-lazyerror')
          sliderInstance?.emit('lazyLoad:error', slide, el, lazyTarget)
        })

        el.classList.add('f-lazyload')
        el.classList.add('f-lazyload')

        sliderInstance?.emit('lazyLoad:load', slide, el, lazyTarget)

        if (dataSrc)
          el.src = dataSrc
        if (dataSrcset)
          el.srcset = dataSrcset
        if (dataSizes)
          el.sizes = dataSizes
      }
      else if (hasBackground) {
        // Preload to cache
        if (!document.body.contains(el)) {
          const preloadImg = document.createElement('img')
          preloadImg.src = dataBg
        }

        el.style.backgroundImage = `url('${dataBg}')`
      }

      delete el.dataset.lazySrc
      delete el.dataset.lazySrcset
      delete el.dataset.lazySizes
      delete el.dataset.lazyBg
    }
  }

  function lazyLoadVisibleSlides() {
    if (!sliderInstance)
      return

    const { preload } = getOptions()
    const currentSlides = [...sliderInstance.getVisibleSlides()]
    const currentPosition = sliderInstance.getPosition()
    const viewportSize = sliderInstance.getViewportDim()

    currentSlides.push(
      ...sliderInstance.getVisibleSlides(currentPosition + viewportSize * preload),
      ...sliderInstance.getVisibleSlides(currentPosition - viewportSize * preload),
    )

    for (const slide of currentSlides) {
      processLazyElements(slide as unknown as CarouselSlide)
    }
  }

  return {
    init(slider) {
      const plugins = slider.getPlugins()
      plugins.Lazyload?.destroy()

      sliderInstance = slider
      sliderInstance.on('render', lazyLoadVisibleSlides)
    },
    destroy() {
      sliderInstance?.off('render', lazyLoadVisibleSlides)
      sliderInstance = undefined
    },
  }
}
