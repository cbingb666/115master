import { createApp, h } from 'vue'
import Aria2SettingsDialog from '@/components/Aria2SettingsDialog/index.vue'
import MasterToast from '@/components/MasterToast/index.vue'
import { registerMagnetTaskHandler } from '@/pages/magnet'
import { ModManager } from './BaseMod'
import FileListMod from './FileListMod'
import { TopFilePathMod } from './TopFilePathMod'
import { TopHeaderMod } from './TopHeaderMod'
import './index.css'

/**
 * 首页页面类
 */
class HomePage {
  /** 修改器管理器 */
  private modManager: ModManager | undefined = undefined

  /**
   * 构造函数
   */
  constructor() {
    this.init()
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.modManager?.destroy()
  }

  /**
   * 初始化
   */
  private async init(): Promise<void> {
    registerMagnetTaskHandler()
    this.modManager = new ModManager([
      new FileListMod(),
      new TopFilePathMod(),
      new TopHeaderMod(),
    ])
    this.mountToast()
    this.mountAria2SettingsDialog()
  }

  /** 挂载 MasterToast 到主文档 body */
  private mountToast(): void {
    const host = document.createElement('div')
    document.body.appendChild(host)
    createApp({ render: () => h(MasterToast) }).mount(host)
  }

  /** 挂载 Aria2 设置对话框到主文档 body */
  private mountAria2SettingsDialog(): void {
    const host = document.createElement('div')
    document.body.appendChild(host)
    createApp({ render: () => h(Aria2SettingsDialog) }).mount(host)
  }
}

export default HomePage
