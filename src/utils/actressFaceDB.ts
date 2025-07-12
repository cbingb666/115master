import type { ActressImageInfo, ActressImageMap } from '../types/actress'
import { GM_notification } from '$'
import { CDN_BASE_URL } from '../constants'
import { actressFaceCache } from './cache/actressFaceCache'

/** 头像数据库仓库地址 */
const GFRIENDS_REP_URL = `${CDN_BASE_URL}/gh/gfriends/gfriends@latest`

/** 头像数据库API地址 */
const GFRIENDS_GITHUB_API_URL = `${GFRIENDS_REP_URL}/Filetree.json`

/**
 * 演员头像数据库
 */
export class ActressFaceDB {
  /** 缓存时长(ms) */
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000
  /** 头像数据库API地址 */
  private static readonly API_URL = GFRIENDS_GITHUB_API_URL

  /** 头像映射 */
  private imageMap: ActressImageMap
  /** 上次更新时间 */
  private lastUpdateTime = -1
  /** 更新定时器 */
  private updateTimer: number | null
  /** 初始化Promise */
  private initPromise: Promise<ActressFaceDB> | null = null
  /** 是否初始化 */
  private isInit = false

  constructor() {
    this.imageMap = new Map()
    this.updateTimer = null
  }

  /**
   * 初始化数据库
   * @description 重复调用会返回同一个promise
   */
  async init(): Promise<void> {
    if (this.isInit) {
      await this.initPromise
      return
    }
    this.isInit = true

    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<ActressFaceDB>(async (resolve) => {
      this.lastUpdateTime = await actressFaceCache.getLastUpdateTime()
      await this.loadFromCache()
      if (await this.checkUpdate()) {
        await this.updateDB()
      }
      resolve(this)
    })
    this.initPromise = promise
    await promise
  }

  /**
   * 从远程更新数据库
   */
  async updateDB(): Promise<void> {
    try {
      GM_notification('️正在更新头像数据库...')
      const response = await fetch(ActressFaceDB.API_URL)
      if (!response.ok) {
        throw new Error(response.status.toString())
      }
      const data: ActressImageInfo = await response.json()
      await this.processAndSaveData(data)
      GM_notification('✅ 头像数据库更新完成')
    }
    catch (error) {
      GM_notification(`❌ 更新头像数据库失败 ${error instanceof Error ? error.message : '未知错误'}`)
      console.error('更新头像数据库失败:', error)
      throw error
    }
  }

  /**
   * 检查是否需要更新
   */
  async checkUpdate(): Promise<boolean> {
    const now = Date.now()
    return now - this.lastUpdateTime >= ActressFaceDB.CACHE_DURATION
  }

  /**
   * 查找演员头像信息
   */
  async findActress(
    name: string,
  ): Promise<
    | { folder: string, filename: string, timestamp: number, url: string }
    | undefined
  > {
    await this.initPromise
    const actress = this.imageMap.get(name)
    if (!actress) {
      return undefined
    }
    const file = actress[0]
    return {
      ...file,
      url: `${GFRIENDS_REP_URL}/Content/${file.folder}/${file.filename}`,
    }
  }

  /**
   * 获取所有演员数据
   */
  getAllActresses(): ActressImageMap {
    return this.imageMap
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    if (this.updateTimer) {
      window.clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  /**
   * 从缓存加载数据
   */
  private async loadFromCache(): Promise<boolean> {
    try {
      const cachedData = await actressFaceCache.getActressData()

      if (cachedData) {
        const now = Date.now()
        if (now - cachedData.timestamp < ActressFaceDB.CACHE_DURATION) {
          this.imageMap = new Map(cachedData.imageMap)
          this.lastUpdateTime = cachedData.timestamp
          return true
        }
      }
      return false
    }
    catch (error) {
      console.error('从缓存加载数据失败:', error)
      return false
    }
  }

  /**
   * 处理并保存数据
   */
  private async processAndSaveData(data: ActressImageInfo): Promise<void> {
    const newMap: ActressImageMap = new Map()

    // 处理数据并构建查找映射
    Object.entries(data.Content).forEach(([folder, files]) => {
      Object.entries(files).forEach(([originalName, filePath]) => {
        const [, timestampStr] = filePath.split('?t=')
        const timestamp = parseInt(timestampStr, 10)
        const actressName = originalName.replace('.jpg', '')
        const file = {
          folder,
          filename: filePath,
          timestamp,
        }
        const files = newMap.get(actressName)
        if (files && files?.length > 0) {
          files.push(file)
          newMap.set(actressName, files)
        }
        else {
          newMap.set(actressName, [file])
        }
      })
    })

    // 更新状态
    this.imageMap = newMap
    this.lastUpdateTime = Date.now()

    // 保存到缓存
    await Promise.all([
      actressFaceCache.saveActressData(
        Array.from(newMap.entries()),
        this.lastUpdateTime,
      ),
    ])
  }
}

// 演员头像数据库实例
export const actressFaceDB = new ActressFaceDB()
