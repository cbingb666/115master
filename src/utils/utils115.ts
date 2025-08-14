import type { WebApi } from '@/utils/drive115/api'
import { GM_xmlhttpRequest } from '$'
import { NORMAL_URL_115 } from '@/constants/115'
import { ICON_FILE_FOLDER, ICON_FILE_IMAGE } from '@/icons'

export class Utils115 {
  static getFileIcon(data: WebApi.Res.Files['data'][number]) {
    // video
    if (Utils115.isVideo(data.iv)) {
      return Utils115.getVideoIcon(data.vdi ?? 0)
    }
    // folder
    if (Utils115.isFolder(data.fc)) {
      return ICON_FILE_FOLDER
    }
    // image
    if (Utils115.isImage(data.ico)) {
      return ICON_FILE_IMAGE
    }
    // document
    if (data.ico === 'docx') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/docx.svg?_vh=eb2e04a_88'
    }
    if (data.ico === 'xlsx') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/xlsx.svg?_vh=eb2e04a_88'
    }
    if (data.ico === 'pptx') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/pptx.svg?_vh=eb2e04a_88'
    }
    if (data.ico === 'txt') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/txt.svg?_vh=eb2e04a_88'
    }
    if (data.ico === 'pdf') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/pdf.svg?_vh=eb2e04a_88'
    }
    // subtitle
    if (data.ico === 'srt') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/srt.svg?_vh=eb2e04a_88'
    }
    if (data.ico === 'ass') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/ass.svg?_vh=eb2e04a_88'
    }
    if (data.ico === 'sub') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/document/sub.svg?_vh=eb2e04a_88'
    }
    // application
    if (data.ico === 'exe') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/application/exe.svg?_vh=18f0547_88'
    }
    if (data.ico === 'apk') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/application/apk.svg?_vh=18f0547_88'
    }
    if (data.ico === 'ipa') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/application/ipa.svg?_vh=18f0547_88'
    }
    if (data.ico === 'deb') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/application/deb.svg?_vh=18f0547_88'
    }
    // archive
    if (data.ico === 'zip') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/archive/zip.svg?_vh=4475ab7_88'
    }
    if (data.ico === 'rar') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/archive/rar.svg?_vh=4475ab7_88'
    }
    if (data.ico === '7z') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/archive/7z.svg?_vh=4475ab7_88'
    }
    if (data.ico === 'tar') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/archive/tar.svg?_vh=4475ab7_88'
    }
    // code
    if (data.ico === 'html') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/code/html.svg?_vh=18f0547_88'
    }
    if (data.ico === 'css') {
      return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/code/css.svg?_vh=18f0547_88'
    }
    // unknown
    return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/other/unknown.png?_vh=f0a959d_88'
  }

  /** 获取视频图标 */
  static getVideoQuality(vdi: number) {
    switch (vdi) {
      case 1:
        return 'sd'
      case 2:
        return 'hd'
      case 3:
        return 'fhd'
      case 4:
        return '1080p'
      case 5:
        return '4k'
      case 100:
        return 'origin'
      default:
        return undefined
    }
  }

  /** 获取视频图标 */
  static getVideoIcon(vdi: number) {
    const quality = this.getVideoQuality(vdi)
    if (quality) {
      return `https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/video_quality/${quality}.svg`
    }
    return 'https://cdnres.115.com/site/static/style_v10.0/file/images/file_type/video/video.svg?_vh=b7ec486_88'
  }

  /** 是否是文件夹 */
  static isFolder(fc: number) {
    return fc === 0
  }

  /** 是否压缩包 */
  static isZip(ico: string) {
    return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ico)
  }

  /** 是否是视频 */
  static isVideo(iv: number) {
    return iv === 1
  }

  /** 是否是图片 */
  static isImage(ico: string) {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg', 'tif', 'tiff', 'heic', 'heif', 'heif-srgb', 'heif-srgb-alpha', 'heif-srgb-alpha-heic', 'heif-srgb-alpha-heif'].includes(ico)
  }

  /** 是否支持打开文档 */
  static isSupportOpenDoc(ico: string) {
    return ['txt', 'xlsx', 'docx', 'pptx', 'xls', 'doc', 'ppt', 'html', 'conf'].includes(ico)
  }

  /**
   * 获取打开文档的链接
   */
  static GetOpenDocUrl({
    pickCode,
ico,
    sha1,
    shareId,
    from,
  }: {
    pickCode: string
    ico: string
    sha1: string
    shareId?: string
    from?: string
  }) {
    const params = new URLSearchParams()
    params.set('ct', 'preview')
    params.set('ac', 'location')
    params.set('pickcode', pickCode)
    params.set('sha1', sha1 || '')
    params.set('from', from || '')
    params.set('ico', ico)
    if (shareId) {
      params.set('share_id', shareId)
    }
    if (ico === 'txt') {
      params.set('t', '1')
    }
    return new URL(`?${params.toString()}`, NORMAL_URL_115)
  }

  /**
   * 获取图片CDN
   * @param url 图片url eg:"https://thumb.115.com/thumb/0/A3/BD/0A3BD157C130067049D84AD8E5E69C4101B68AFF_100?s=NkLS0OD1jgZRAfryUHHJ0g&t=1754144562"
   * @returns 图片CDN eg:https://cdnfileimg.116cd.cn/8bd8915c7ae68073d8c3b5c8c30f8215/688E1352/6857dc657e5155bb4ed9e7be1a450e6b8d3d161d?x-oss-process=style/100s
   */
  static getImageCDN(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const request = GM_xmlhttpRequest({
        url,
        method: 'GET',
        redirect: 'follow',
        onreadystatechange: (res) => {
          if (res.readyState > 1) {
            request.abort()
            console.log(res)
            resolve(res.finalUrl)
          }
        },
        onerror: (err) => {
          reject(err)
        },
      })
    })
  }

  /**
   * 移除OSS处理参数
   * @param url 图片url eg:https://cdnfileimg.116cd.cn/8bd8915c7ae68073d8c3b5c8c30f8215/688E1352/6857dc657e5155bb4ed9e7be1a450e6b8d3d161d?x-oss-process=style/100s
   * @returns 图片url eg:https://cdnfileimg.116cd.cn/8bd8915c7ae68073d8c3b5c8c30f8215/688E1352/6857dc657e5155bb4ed9e7be1a450e6b8d3d161d
   */
  static omitOssProcess(url: string) {
    return url.replace(/\?x-oss-process=.*$/, '')
  }

  static replaceOssProcess(url: string, process: string) {
    return url.replace(/\?x-oss-process=.*$/, `?x-oss-process=${process}`)
  }

  /**
   * 获取缩略图
   * @param url 缩略图url
   * @param size 缩略图大小，默认480, 可选100, 200, 480, 720, 1080, 1440, 2160
   * @returns 缩略图url
   */
  static getScaleThumbnail(url: string, size: number = 480) {
    return url.replace('_100', `_${size}`)
  }
}
