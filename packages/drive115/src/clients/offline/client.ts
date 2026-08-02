import type { Drive115Response } from '../../core/response.ts'
import type { Req, Res } from './index.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'

/**
 * 离线下载（云下载）相关 API
 */
export class OfflineApiClient extends BaseApiClient {
  /** 获取离线空间 */
  async getOfflineSpace(data: Req.OfflineSpace = {}): Promise<Drive115Response<Res.OfflineSpace>> {
    return this.handle<Res.OfflineSpace>(
      this.fetchRequest.get(
        new URL('/web/lixian/space', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'space',
            _: Date.now(),
          },
          data,
        },
      ).then(r => r.json()),
    )
  }

  /** 获取离线配额 */
  async getOfflineGetQuotaPackageInfo(data: Req.OfflineGetQuotaPackageInfo = {}): Promise<Drive115Response<Res.OfflineGetQuotaPackageInfo>> {
    return this.handle<Res.OfflineGetQuotaPackageInfo>(
      this.fetchRequest.get(
        new URL('/web/lixian', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'get_quota_package_info',
          },
          data,
        },
      ).then(r => r.json()),
    )
  }

  /** 获取云下载默认保存目录 */
  async getOfflineDownloadPath(data: Req.OfflineDownloadPath = {}): Promise<Drive115Response<Res.OfflineDownloadPath>> {
    return this.handle<Res.OfflineDownloadPath>(
      this.fetchRequest.get(
        new URL('/offine/downpath', URL_115.WEB_API).href,
        {
          params: {
            limit: 1150,
            ...data,
          },
        },
      ).then(r => r.json()),
    )
  }

  /** 获取离线任务列表 */
  async postOfflineTaskLists(data: Req.OfflineTaskLists): Promise<Drive115Response<Res.OfflineTaskLists>> {
    return this.handle<Res.OfflineTaskLists>(
      this.fetchRequest.post(
        new URL('/web/lixian/', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'task_lists',
          },
          data: {
            page: 1,
            ...data,
          },
          credentials: 'include',
        },
      ).then(r => r.json()),
    )
  }

  /** 添加单个离线任务 */
  async postOfflineAddUrl(data: Req.OfflineAddUrl): Promise<Drive115Response<Res.OfflineAddUrl>> {
    return this.handle<Res.OfflineAddUrl>(
      this.fetchRequest.post(
        new URL('/web/lixian/', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'add_task_url',
          },
          data,
          credentials: 'include',
        },
      ).then(r => r.json()),
    )
  }

  /** 添加一组离线任务 */
  async postOfflineAddUrls(data: Req.OfflineAddUrls): Promise<Drive115Response<Res.OfflineAddUrls>> {
    return this.handle<Res.OfflineAddUrls>(
      this.fetchRequest.post(
        new URL('/web/lixian/', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'add_task_urls',
          },
          data,
          credentials: 'include',
        },
      ).then(r => r.json()),
    )
  }

  /** 解析种子（种子文件需先上传到网盘，取回 pickcode 与 sha1） */
  async postOfflineTorrent(data: Req.OfflineTorrent): Promise<Drive115Response<Res.OfflineTorrent>> {
    return this.handle<Res.OfflineTorrent>(
      this.fetchRequest.post(
        new URL('/web/lixian/', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'torrent',
          },
          data,
          credentials: 'include',
        },
      ).then(r => r.json()),
    )
  }

  /** 添加 BT 离线任务 */
  async postOfflineAddTaskBt(data: Req.OfflineAddTaskBt): Promise<Drive115Response<Res.OfflineAddTaskBt>> {
    return this.handle<Res.OfflineAddTaskBt>(
      this.fetchRequest.post(
        new URL('/web/lixian/', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'add_task_bt',
          },
          data,
          credentials: 'include',
        },
      ).then(r => r.json()),
    )
  }

  /** 删除离线任务 */
  async postOfflineTaskDel(data: Req.OfflineTaskDel): Promise<Drive115Response<Res.OfflineTaskDel>> {
    return this.handle<Res.OfflineTaskDel>(
      this.fetchRequest.post(
        new URL('/web/lixian/', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'task_del',
          },
          data,
          credentials: 'include',
        },
      ).then(r => r.json()),
    )
  }

  /** 清空离线任务 */
  async postOfflineTaskClear(data: Req.OfflineTaskClear): Promise<Drive115Response<Res.OfflineTaskClear>> {
    return this.handle<Res.OfflineTaskClear>(
      this.fetchRequest.post(
        new URL('/web/lixian/', URL_115.NORMAL).href,
        {
          params: {
            ct: 'lixian',
            ac: 'task_clear',
          },
          data,
          credentials: 'include',
        },
      ).then(r => r.json()),
    )
  }
}
