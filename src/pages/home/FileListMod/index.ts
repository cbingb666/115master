import type { FileListScrollHistory } from './scrollHistory'
import { unsafeWindow } from '$'
// 移除未使用的 isReload 导入
import { BaseMod } from '../BaseMod'
import { FileListType } from '../types'
import { FileItemModLoader } from './FileItemLoader'
import { FileItemModActressInfo } from './FileItemMod/actressInfo'
import { FileItemModClickPlay } from './FileItemMod/clickPlay'
import { FileItemModDownload } from './FileItemMod/download'
import { FileItemModExtInfo } from './FileItemMod/extInfo'
import { FileItemModExtMenu } from './FileItemMod/extMenu'
import { FileItemModVideoCover } from './FileItemMod/videoCover'
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
    const config = unsafeWindow.Main?.CONFIG
    const configSelector = config?.DataListBox

    /** 尝试多个可能的选择器 */
    const possibleSelectors = [
      configSelector,
      '#js_data_list',
      '#js_cantain_box',
      '.page-container',
      '.list-wrap',
    ].filter(Boolean)

    let node: HTMLElement | null = null

    for (const selector of possibleSelectors) {
      node = document.querySelector<HTMLElement>(selector!)
      if (node) {
        break
      }
    }

    return node
  }

  /** 获取文件列表dom */
  get listCellNode() {
    /** 尝试多个可能的选择器 */
    const selectors = ['.list-cell', '.list-wrap', '#js_data_list .list-cell']
    let node: HTMLElement | null = null

    for (const selector of selectors) {
      node = document.querySelector<HTMLElement>(selector)
      if (node) {
        break
      }
    }

    return node
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
    const listCell = this.listCellNode

    if (!listCell) {
      return undefined
    }

    /** 尝试多种方式查找li元素 */
    const directLi = listCell.querySelectorAll('li')
    const contentsLi = listCell.querySelector('.list-contents')?.querySelectorAll('li')

    const items = directLi.length > 0 ? directLi : contentsLi

    return items
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
   * 等待DOM准备就绪
   */
  private async waitForDOMReady(): Promise<void> {
    const maxAttempts = 50 /** 最多尝试50次 */
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++

      const itemNodes = this.itemNodes

      if (itemNodes && itemNodes.length > 0) {
        return
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * 初始化
   */
  private async init() {
    await this.waitForDOMReady()
    this.watchItemsChange()
    this.updateItems()
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
    const listScrollBoxNode = this.listScrollBoxNode

    if (!itemNodes || itemNodes.length === 0) {
      return
    }

    if (!listScrollBoxNode) {
      return
    }

    const itemsSet = new Set(itemNodes)

    // 创建新 Item 修改器
    for (const item of itemsSet) {
      // 如果已经存在，则跳过
      if (this.itemModLoaderMaps.has(item)) {
        continue
      }
      const itemModLoader = new FileItemModLoader(
        item,
        this.listType,
        listScrollBoxNode,
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
