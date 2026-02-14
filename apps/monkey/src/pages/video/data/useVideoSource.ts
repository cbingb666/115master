import type { VideoSource } from '@/components/XPlayer'
import { ref } from 'vue'
import { VIDEO_SOURCE_EXTENSION } from '@/components/XPlayer/index.const'
import { qualityNumMap } from '@/constants/quality'
import { drive115 } from '@/utils/drive115Instance'
import { getFileExtensionByUrl } from '@/utils/file'
import { appLogger } from '@/utils/logger'
import { setVideoCookie } from '..'

/** 日志 */
const logger = appLogger.sub('useDataVideoSources')

/** 视频源 */
export function useDataVideoSources() {
  const list = ref<VideoSource[]>([])

  const fetch = async (pickCode: string) => {
    const [download, m3u8List] = await Promise.allSettled([
      drive115.getFileDownloadUrl(pickCode),
      drive115.getM3u8(pickCode),
    ])

    if (download.status === 'fulfilled') {
      if (download.value.url.auth_cookie) {
        logger.info('设置cookie', download.value.url.auth_cookie)
        try {
          await setVideoCookie({
            name: download.value.url.auth_cookie.name,
            value: download.value.url.auth_cookie.value,
            path: '/',
            domain: '.115cdn.net',
            secure: true,
            expirationDate: Number(download.value.url.auth_cookie.expire),
            sameSite: 'no_restriction',
          })
        }
        catch (error) {
          alert('设置cookie失败，请升级浏览器和油猴版本')
          throw error
        }
      }

      const extension
        = getFileExtensionByUrl(download.value.url.url)
          ?? VIDEO_SOURCE_EXTENSION.unknown

      list.value.unshift({
        name: 'Ultra',
        url: download.value.url.url,
        type: 'auto',
        extension,
        quality: 99999,
        displayQuality: 'Ultra',
      })
    }

    if (m3u8List.status === 'fulfilled') {
      list.value.push(
        ...m3u8List.value.map(item => ({
          name: `${item.quality}P`,
          url: item.url,
          type: 'hls' as const,
          extension: VIDEO_SOURCE_EXTENSION.m3u8,
          quality: item.quality,
          displayQuality:
            qualityNumMap[item.quality as keyof typeof qualityNumMap],
        })),
      )
    }
    else {
      logger.error('m3u8 获取失败:', m3u8List.reason)
    }
  }

  const clear = () => {
    list.value = []
  }

  return {
    list,
    fetch,
    clear,
  }
}
