import { useStorage } from '@vueuse/core'

export type DriveListMode = 'pagination' | 'infinite'

export const DRIVE_LIST_MODE_KEY = '115Master_drive_list_load_mode'

/** 网盘文件列表加载方式，多个调用方通过 useStorage 的同页事件保持同步。 */
export function useDriveListMode() {
  return useStorage<DriveListMode>(DRIVE_LIST_MODE_KEY, 'pagination')
}
