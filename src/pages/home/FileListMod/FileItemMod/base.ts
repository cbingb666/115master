import type { ItemInfo } from '@/pages/home/types'
import type { UserSettings } from '@/utils/userSettings'
import { userSettings } from '@/utils/userSettings'

/**
 * 文件列表 Item 修改器基类
 */
export abstract class FileItemModBase {
  /** 是否 Plus */
  readonly IS_PLUS: boolean = false
  /** 在用户设置中的使能字段 */
  readonly ENABLE_KEY_IN_USER_SETTING: keyof UserSettings['value'] | undefined
    = undefined

  /**
   * 构造函数
   * @param itemNode item dom
   * @param itemInfo item 信息
   */
  constructor(
    readonly itemNode: HTMLElement,
    readonly itemInfo: ItemInfo,
  ) {}

  /** 加载 */
  load() {
    if (this.ENABLE_KEY_IN_USER_SETTING) {
      if (userSettings.value[this.ENABLE_KEY_IN_USER_SETTING]) {
        this.onLoad()
      }
      userSettings.watch(this.ENABLE_KEY_IN_USER_SETTING, (_, newValue) => {
        if (newValue) {
          this.onLoad()
        }
        else {
          this.destroy()
        }
      })
    }
    else {
      this.onLoad()
    }
  }

  /** 销毁 */
  destroy() {
    this.onDestroy()
  }
  /** 加载时 */
  abstract onLoad(): void
  /** 销毁时 */
  abstract onDestroy(): void
}

/**
 * 文件列表 Item 修改器类型
 */
export type FileListMod = new (
  itemNode: HTMLElement,
  itemInfo: ItemInfo,
) => FileItemModBase
