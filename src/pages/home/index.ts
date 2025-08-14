import { ModManager } from '@/pages/home/BaseMod'
import FileListMod from '@/pages/home/FileListMod'
import NavMod from '@/pages/home/NavMod'
import { TopFilePathMod } from '@/pages/home/TopFilePathMod'
import { TopHeaderMod } from '@/pages/home/TopHeaderMod'
import { registerMagnetTaskHandler } from '@/pages/magnet'
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
      new NavMod(),
      new FileListMod(),
      new TopFilePathMod(),
      new TopHeaderMod(),
    ])
  }
}

export default HomePage
