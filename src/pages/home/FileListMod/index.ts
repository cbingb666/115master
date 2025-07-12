import { unsafeWindow } from '$'
import { isReload } from '../../../utils/route'
import { BaseMod } from '../BaseMod'
import { FileListType } from '../types'
import { FileItemModLoader } from './FileItemLoader'
import { FileItemModActressInfo } from './FileItemMod/actressInfo'
import { FileItemModClickPlay } from './FileItemMod/clickPlay'
import { FileItemModDownload } from './FileItemMod/download'
import { FileItemModExtInfo } from './FileItemMod/extInfo'
import { FileItemModExtMenu } from './FileItemMod/extMenu'
import { FileItemModVideoCover } from './FileItemMod/videoCover'
import { FileListScrollHistory } from './scrollHistory'
import './index.css'

const itemMods = [
  FileItemModExtInfo,
  FileItemModActressInfo,
  FileItemModVideoCover,
  FileItemModExtMenu,
  FileItemModClickPlay,
  FileItemModDownload,
]

/**
 * 文件列表修改器
 */
class FileListMod extends BaseMod {
  /** 文件列表 Item Mod Loader Map */
  private itemModLoaderMaps: Map<HTMLLIElement, FileItemModLoader> = new Map()
  /** 文件列表变化监听器 */
  private observerContent: MutationObserver | null = null
  /** 文件列表滚动位置记录 */
  private scrollHistory: FileListScrollHistory | null = null

  constructor() {
    super()
    this.init()
  }

  /**
   * 获取文件列表容器节点
   */
  get dataListBoxNode() {
    return document.querySelector<HTMLElement>(
      unsafeWindow.Main.CONFIG.DataListBox,
    )
  }

  /** 获取文件列表dom */
  get listCellNode() {
    return document.querySelector<HTMLElement>('.list-cell') ?? null
  }

  /**
   * 获取文件列表内容节点
   */
  get listContentsNode() {
    return this.listCellNode?.querySelector<HTMLElement>('.list-contents')
  }

  /**
   * 获取文件列表内容节点
   */
  get listThumbNode() {
    return this.listCellNode?.querySelector<HTMLElement>('.list-thumb')
  }

  /**
   * 获取文件列表滚动容器节点
   */
  get listScrollBoxNode() {
    return this.listContentsNode ?? this.listThumbNode
  }

  /**
   * 获取文件列表类型
   */
  get listType(): FileListType {
    if (this.listContentsNode) {
      return FileListType.list
    }
    return FileListType.grid
  }

  /**
   * 获取文件列表 Item Nodes
   */
  get itemNodes() {
    return this.listCellNode?.querySelectorAll('li')
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.observerContent?.disconnect()
    this.destroyAllItemModLoader()
    this.scrollHistory?.destroy()
  }

  /**
   * 初始化
   */
  private async init() {
    this.updateItems()
    this.scrollHistory = new FileListScrollHistory()
    isReload() && this.scrollHistory.clearAll()
    if (this.listScrollBoxNode) {
      this.scrollHistory?.setScrollBox(this.listScrollBoxNode)
    }
    this.watchItemsChange()
  }

  /**
   * 监听文件列表 Item 变化
   */
  private watchItemsChange() {
    let observerContent: MutationObserver | null = null
    observerContent = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // 如果目标节点是文件列表dom，并且有新增节点，则更新文件列表
        if (
          mutation.target.isSameNode(this.dataListBoxNode)
          && mutation.addedNodes.length > 0
        ) {
          this.updateItems()
          this.listScrollBoxNode
          && this.scrollHistory?.setScrollBox(this.listScrollBoxNode)
          break
        }
      }
    })

    if (!this.dataListBoxNode) {
      console.error('文件列表容器节点不存在, 无法监听文件列表变化')
      return
    }

    observerContent.observe(this.dataListBoxNode!, {
      childList: true,
    })
    this.observerContent = observerContent
  }

  /**
   * 更新文件列表
   */
  private updateItems() {
    const itemNodes = this.itemNodes
    const itemsSet = new Set(itemNodes)

    if (!itemsSet) {
      return
    }

    // 创建新 Item 修改器
    for (const item of itemsSet) {
      // 如果已经存在，则跳过
      if (this.itemModLoaderMaps.has(item)) {
        continue
      }
      const itemModLoader = new FileItemModLoader(
        item,
        this.listType,
        this.listScrollBoxNode!,
        itemMods,
      )
      itemModLoader.load()
      this.itemModLoaderMaps.set(item, itemModLoader)
    }
    // 销毁旧 Item 修改器
    for (const [key, value] of this.itemModLoaderMaps.entries()) {
      // 如果 li Node 存在，则跳过
      if (itemsSet.has(key)) {
        continue
      }
      // 销毁文件列表item
      value.destroy()
      // 删除文件列表item
      this.itemModLoaderMaps.delete(key)
    }
  }

  /**
   * 销毁所有 Item Mod Loader
   */
  private destroyAllItemModLoader(): void {
    this.itemModLoaderMaps.forEach((item) => {
      item.destroy()
    })
    this.itemModLoaderMaps.clear()
  }
}

export default FileListMod
