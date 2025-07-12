import { GM_getValue, GM_setValue } from '$'

/** 用户设置接口 */
interface Settings {
  /** 启动文件列表预览 */
  enableFilelistPreview: boolean
}

/** 默认设置 */
const DEFAULT_SETTINGS: Settings = {
  enableFilelistPreview: true,
}

/** 监听任务接口 */
interface WatchTask<K extends keyof Settings> {
  key: K
  callback: (oldValue: Settings[K], newValue: Settings[K]) => void
}

/** 任意监听任务 */
type AnyWatchTask = WatchTask<keyof Settings>

/**
 * 用户设置
 */
export class UserSettings {
  value: Settings
  private watchTasks: AnyWatchTask[] = []
  constructor() {
    this.value = this.create()
  }

  /** 监听设置 */
  watch<K extends keyof Settings>(
    key: K,
    callback: (oldValue: Settings[K], newValue: Settings[K]) => void,
  ) {
    const watchTask = {
      key,
      callback,
    }
    this.watchTasks.push(watchTask)

    /** 返回取消监听的函数 */
    return () => {
      const index = this.watchTasks.indexOf(watchTask)
      if (index > -1) {
        this.watchTasks.splice(index, 1)
      }
    }
  }

  /** 创建用户设置 */
  private create() {
    const namespace = 'USER_SETTINGS'
    const value = GM_getValue(namespace) ?? {}
    const userSettings = { ...DEFAULT_SETTINGS, ...value }
    const proxy = new Proxy(userSettings, {
      get: (target, key) => {
        return target[key]
      },
      set: (target, key, newValue) => {
        const oldValue = target[key]
        target[key] = newValue
        GM_setValue(namespace, target)
        // 触发相关的watch回调
        this.watchTasks.forEach((task) => {
          if (task.key === key) {
            task.callback(oldValue, newValue)
          }
        })

        return true
      },
    })
    return proxy
  }
}

/** 用户设置实例 */
export const userSettings = new UserSettings()
