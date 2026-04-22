import type { Aria2RpcPreset } from '@/utils/aria2'
import { toast } from '@/components/MasterToast/toast'
import { FileListType, FileType } from '@/pages/home/types'
import { aria2Events, pushFile, pushFolder, readSettings, subscribeSettings } from '@/utils/aria2'
import { is115Browser } from '@/utils/platform'
import { FileItemModBase } from './base'

/**
 * FileItemMod — 行内 Aria2 推送按钮
 * 三态：0 个 RPC 预设 → 配置引导；1 个 → 单按钮；≥2 → 下拉
 */
export class FileItemModAria2Push extends FileItemModBase {
  private container: HTMLElement | null = null
  private unsubscribe: (() => void) | null = null

  get fileOprNode() {
    return (
      this.itemNode.querySelector<HTMLElement>('.file-opr')
      ?? this.itemNode.querySelector<HTMLElement>('.file-opt')
    )
  }

  get isFolder() {
    return this.itemInfo.attributes.file_type === FileType.folder
  }

  onLoad() {
    if (is115Browser)
      return
    if (this.itemInfo.fileListType === FileListType.grid)
      return
    if (!this.fileOprNode)
      return

    this.render()
    this.unsubscribe = subscribeSettings(() => this.render())
  }

  onDestroy() {
    this.container?.remove()
    this.container = null
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  private render() {
    this.container?.remove()
    this.container = document.createElement('span')
    this.container.style.cssText
      = 'display:inline-flex;align-items:center;margin-right:8px;position:relative;z-index:1000;pointer-events:all;'

    const list = readSettings().rpcList
    if (list.length === 0) {
      this.container.appendChild(this.buildConfigButton())
    }
    else if (list.length === 1) {
      this.container.appendChild(this.buildSingleButton(list[0]))
    }
    else {
      this.container.appendChild(this.buildDropdown(list))
    }

    this.fileOprNode?.prepend(this.container)
  }

  private buildConfigButton(): HTMLElement {
    const a = document.createElement('a')
    a.href = 'javascript:void(0)'
    a.textContent = '⚙ 配置 Aria2'
    a.title = '尚未配置 Aria2 RPC，点击打开设置'
    a.style.cssText
      = 'color:#888;padding:2px 6px;border:1px dashed #aaa;border-radius:4px;font-size:12px;'
    a.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      aria2Events.emit('aria2:open-settings')
    })
    return a
  }

  private buildSingleButton(preset: Aria2RpcPreset): HTMLElement {
    const a = document.createElement('a')
    a.href = 'javascript:void(0)'
    a.textContent = `⇩ ${preset.name}`
    a.title = `推送到 Aria2：${preset.name}`
    a.style.cssText = 'padding:2px 6px;font-size:12px;'
    a.addEventListener('mousedown', async (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      await this.handlePush(preset)
    })
    return a
  }

  private buildDropdown(presets: Aria2RpcPreset[]): HTMLElement {
    const wrap = document.createElement('span')
    wrap.style.cssText = 'position:relative;display:inline-block;'

    const trigger = document.createElement('a')
    trigger.href = 'javascript:void(0)'
    trigger.textContent = '⇩ Aria2 ▾'
    trigger.style.cssText = 'padding:2px 6px;font-size:12px;'

    const menu = document.createElement('div')
    menu.style.cssText
      = 'position:absolute;top:100%;left:0;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);padding:4px 0;min-width:140px;display:none;z-index:1001;'

    for (const p of presets) {
      const item = document.createElement('a')
      item.href = 'javascript:void(0)'
      item.textContent = p.name
      item.style.cssText
        = 'display:block;padding:6px 12px;font-size:12px;color:#333;text-decoration:none;'
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f1f5f9'
      })
      item.addEventListener('mouseleave', () => {
        item.style.background = ''
      })
      item.addEventListener('mousedown', async (e) => {
        e.preventDefault()
        e.stopImmediatePropagation()
        menu.style.display = 'none'
        await this.handlePush(p)
      })
      menu.appendChild(item)
    }

    const divider = document.createElement('div')
    divider.style.cssText = 'border-top:1px solid #eee;margin:4px 0;'
    menu.appendChild(divider)

    const settingsItem = document.createElement('a')
    settingsItem.href = 'javascript:void(0)'
    settingsItem.textContent = '⚙ 设置'
    settingsItem.style.cssText
      = 'display:block;padding:6px 12px;font-size:12px;color:#666;text-decoration:none;'
    settingsItem.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      menu.style.display = 'none'
      aria2Events.emit('aria2:open-settings')
    })
    menu.appendChild(settingsItem)

    wrap.addEventListener('mouseenter', () => {
      menu.style.display = 'block'
    })
    wrap.addEventListener('mouseleave', () => {
      menu.style.display = 'none'
    })

    wrap.appendChild(trigger)
    wrap.appendChild(menu)
    return wrap
  }

  private async handlePush(rpc: Aria2RpcPreset) {
    const attrs = this.itemInfo.attributes
    if (this.isFolder) {
      /** 文件夹的「自身 id」在 115 DOM 里是 cate_id；cid 是所在的父目录 */
      const folderCid = attrs.cate_id || attrs.cid
      if (!folderCid) {
        toast.error('无法获取文件夹 ID')
        return
      }
      const handle = toast.loading(`正在获取文件列表... 0`)
      try {
        const result = await pushFolder({
          cid: folderCid,
          rootPath: attrs.title,
          rpc,
          onListProgress: walked => handle.update(`正在获取文件列表... ${walked}`),
          onPushProgress: (done, total, failed) =>
            handle.update(`推送中 ${done}/${total}${failed ? `（失败 ${failed}）` : ''}`),
        })
        if (result.failed === 0) {
          handle.success(`已推送 ${result.done} 个文件`)
        }
        else {
          handle.error(`已推送 ${result.done}，失败 ${result.failed}`)
        }
      }
      catch (e) {
        handle.error(`推送失败：${e instanceof Error ? e.message : String(e)}`)
      }
    }
    else {
      const h = toast.loading(`推送 ${attrs.title}...`)
      try {
        await pushFile(
          {
            pickCode: attrs.pick_code,
            name: attrs.title,
            sha1: attrs.sha1,
          },
          rpc,
        )
        h.success('推送成功')
      }
      catch (e) {
        h.error(`推送失败：${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
}
