import { defer } from 'lodash'
import { BaseMod } from '@/pages/home/BaseMod'
import './index.css'
import 'iconify-icon'

/**
 * 115 页面顶部路径修改
 * @description
 * 1. 修改页面顶部路径为当前目录路径
 * 2. 添加一个返回上级目录按钮
 */
export class TopFilePathMod extends BaseMod {
  private mutationObserver: MutationObserver | null = null
  private backButton: HTMLAnchorElement | null = null

  constructor() {
    super()
    this.init()
  }

  /**
   * 文件路径 Box
   */
  private get filePathBoxNode() {
    return document.querySelector<HTMLElement>('#js_top_header_file_path_box')
  }

  /**
   * 当前路径容器
   */
  private get topFilePathContainerNode() {
    return document.querySelector<HTMLElement>(
      '.list-topheader .top-file-path',
    )
  }

  /**
   * 路径Tooltip
   */
  private get commonLittlePopNode() {
    return this.filePathBoxNode?.querySelector<HTMLElement>(
      '.common-little-pop',
    )
  }

  /**
   * 当前目录路径节点
   */
  private get filePathNode() {
    return this.topFilePathContainerNode?.querySelector('.file-path')
  }

  /**
   * 当前目录路径链接
   */
  private get readPathLinkNodes() {
    return this.filePathNode?.querySelectorAll('a')
  }

  /**
   * 是否存在搜索返回按钮
   * @description 在星标页面进入二级目录后会出现这个按钮
   */
  private get hasSearchBackButton() {
    return this.topFilePathContainerNode?.querySelector('[menu="back_search"]')
  }

  /**
   * 销毁
   */
  destroy() {
    this.mutationObserver?.disconnect()
    this.backButton?.remove()
  }

  /**
   * 当前路径
   * @returns 路径列表
   */
  private readPaths() {
    const pathDom = this.readPathLinkNodes
    if (!pathDom)
      return []
    /** 多级目录 */
    const isMultiLevel = pathDom.length > 1

    return Array.from(pathDom)
      .map((item) => {
        const title = item.getAttribute('titletext') ?? ''
        const cid = item.getAttribute('cid') ?? ''
        /** 根目录 */
        const isRoot = cid === '0'
        if (isMultiLevel && isRoot) {
          return ''
        }
        return title
      })
      .filter(item => item !== '')
  }

  /**
   * 设置页面标题为当前路径
   */
  private setTopDocumentTitleWithPaths() {
    const paths = this.readPaths()
    const title = paths?.reverse().join(' < ') ?? ''
    if (top?.document && title !== '') {
      top.document.title = title
    }
  }

  /**
   * 添加返回上级目录按钮
   */
  private addBackButton() {
    if (!this.topFilePathContainerNode)
      return
    this.backButton = document.createElement('a')
    this.backButton.classList.add('master-back-button')
    this.backButton.href = 'javascript:void(0)'
    this.backButton.innerHTML
      = '<iconify-icon icon="material-symbols:line-start-arrow-notch" noobserver></iconify-icon>返回目录'
    this.topFilePathContainerNode?.before(this.backButton)
    /** 修复路径Tooltip位置 */
    if (this.commonLittlePopNode) {
      this.commonLittlePopNode.style.marginLeft = `${this.filePathNode?.getBoundingClientRect().left}px`
    }
    this.backButton.addEventListener('click', () => {
      const prevPathLink
        = this.readPathLinkNodes?.[this.readPathLinkNodes.length - 2]
      if (prevPathLink) {
        prevPathLink.click()
      }
    })
  }

  /**
   * 删除返回按钮
   */
  private removeBackButton() {
    this.backButton?.remove()
    this.backButton = null
    /** 恢复路径Tooltip位置 */
    if (this.commonLittlePopNode) {
      this.commonLittlePopNode.style.marginLeft = '0'
    }
  }

  /**
   * 控制返回按钮显示/隐藏
   */
  private controlBackButtonShow() {
    const onlyOnePath = (this.readPathLinkNodes?.length ?? 0) <= 1
    if (onlyOnePath || this.hasSearchBackButton) {
      this.removeBackButton()
    }
    else if (!this.backButton) {
      this.addBackButton()
    }
  }

  /**
   * 监听路径变化
   * @param callback 回调函数
   */
  private watchPathsChange(callback: () => void) {
    if (!this.topFilePathContainerNode)
      return
    this.mutationObserver = new MutationObserver(callback)
    this.mutationObserver.observe(this.topFilePathContainerNode, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * 初始化
   */
  private init() {
    defer(() => {
      this.setTopDocumentTitleWithPaths()
      this.controlBackButtonShow()
      this.watchPathsChange(() => {
        this.setTopDocumentTitleWithPaths()
        this.controlBackButtonShow()
      })
    })
  }
}
