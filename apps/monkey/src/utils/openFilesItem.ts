import type { Share } from '@115master/drive115'
import { Utils115 } from '@/utils/utils115'

/** 文件项的可打开链接：路由跳转 / 外链 / 无（图片预览或不支持） */
export interface FileLink {
  to?: string
  href?: string
  target?: string
}

/** 按类型解析文件项的目标链接（视频→播放页、文档→外链、文件夹→目录） */
export function resolveFileLink(item: Share.Entity.FilesItem): FileLink | undefined {
  if (Utils115.isVideo(item.iv))
    return { to: `/video/${item.pc}`, target: '_self' }

  if (Utils115.isSupportOpenDoc(item.ico)) {
    return {
      href: Utils115.GetOpenDocUrl({
        pickCode: item.pc,
        ico: item.ico,
        sha1: item.sha,
        shareId: '',
        from: '',
      }).href,
      target: '_blank',
    }
  }

  if (item.fc === 0)
    return { to: `/drive/${item.cid}`, target: '_self' }

  return undefined
}

/** 打开文件项所需的外部依赖（注入以保持纯度） */
export interface OpenFilesItemCtx {
  router: { push: (to: string) => void }
  alert: (opts: { title?: string, content: string, confirmText?: string }) => void
  folderPreview?: { open: (item: Share.Entity.FilesItem) => Promise<void> } | null
  onPreview?: (item: Share.Entity.FilesItem) => void
}

/** 打开文件项：路由跳转 / 外链 / 图片预览 / 不支持提示。供 useFileItem.open 与列表层 onOpen 共用 */
export async function openFilesItem(
  item: Share.Entity.FilesItem,
  ctx: OpenFilesItemCtx,
): Promise<void> {
  const link = resolveFileLink(item)
  if (link) {
    if (link.to) {
      ctx.router.push(link.to)
      return
    }
    if (link.href) {
      window.open(link.href, link.target)
      return
    }
  }

  if (item.u) {
    if (ctx.folderPreview)
      await ctx.folderPreview.open(item)
    else
      ctx.onPreview?.(item)
    return
  }

  ctx.alert({
    title: '提示',
    content: '暂不支持打开该文件类型',
    confirmText: '知道了',
  })
}
