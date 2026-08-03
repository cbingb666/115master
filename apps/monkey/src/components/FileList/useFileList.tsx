import type { Share } from '@115master/drive115'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { computed } from 'vue'
import { Utils115 } from '@/utils/utils115'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

export function useFilePreview(props: { listData: Share.Entity.FilesItem[] }) {
  const images = computed(() => {
    return props.listData?.filter(i => Boolean(i.u))
  })

  const preview = (item: Share.Entity.FilesItem) => {
    const realIndex = images.value?.findIndex(i => i.pc === item.pc)
    const dataSource = images.value?.map((item, index) => {
      return {
        src: Utils115.getScaleThumbnail(item.u, 0),
        thumbSrc: item.u,
        caption: item.n,
        index: images.value?.length ?? 0 - index,
      }
    })
    Fancybox.show(dataSource, {
      startIndex: realIndex,
      mainStyle: {
        '--fancybox-backdrop-bg': 'rgba(0, 0, 0, 1)',
      },
      Carousel: {
        transition: 'crossfade',
        Lazyload: {
          showLoading: true,
          preload: 30,
        },
        Toolbar: {
          display: {
            left: ['counter'],
            right: ['autoplay', 'thumbs', 'download', 'fullscreen', 'close'],
          },
        },
      },
      idle: 1000,
    })
  }

  return { preview }
}
