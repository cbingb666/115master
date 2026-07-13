import type { Drive115Response } from '../../core/response.ts'
import type { GetFilesByLabel, GetLabels, LabelItem, PostFileLabels, PostLabelDelete, PostLabelEdit, PostLabelOrder, SearchLabels } from './req.ts'
import type { FileLabels, FilesByLabel, LabelDelete, LabelEdit, LabelOrder, Labels, LabelsAdd } from './res.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'
import { LabelColor } from './req.ts'

/** 标签颜色与名称之间的分隔符（elevengo/115 协议使用 \x07） */
const LABEL_COLOR_SEP = '\x07'

/** 标签接口使用 `message` 返回错误，转成核心响应管道识别的字段。 */
function normalizeTagResponse(raw: unknown) {
  if (!raw || typeof raw !== 'object')
    return raw
  const payload = raw as Record<string, unknown>
  const hasError = (typeof payload.error === 'string' && payload.error !== '')
    || (typeof payload.error_msg === 'string' && payload.error_msg !== '')
  if (typeof payload.message !== 'string' || payload.message === '' || hasError)
    return raw
  return { ...payload, error: payload.message }
}

function serializeColor(color?: string) {
  return color === LabelColor.Blank ? '' : color ?? ''
}

/**
 * 标签相关 API
 */
export class TagApiClient extends BaseApiClient {
  /** 获取标签列表 */
  async getLabels(params: GetLabels): Promise<Drive115Response<Labels>> {
    return this.handle<Labels>(
      this.fetchRequest.get(
        new URL('/label/list', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()).then(normalizeTagResponse),
    )
  }

  /** 按关键字搜索标签 */
  async searchLabels(params: SearchLabels): Promise<Drive115Response<Labels>> {
    return this.handle<Labels>(
      this.fetchRequest.get(
        new URL('/label/list', URL_115.WEB_API).href,
        { params },
      ).then(r => r.json()).then(normalizeTagResponse),
    )
  }

  /** 创建标签（支持批量） */
  async addLabels(labels: LabelItem[]): Promise<Drive115Response<LabelsAdd>> {
    const data = labels.reduce<Record<string, string>>((acc, item, index) => {
      acc[`name[${index}]`] = `${item.name}${LABEL_COLOR_SEP}${serializeColor(item.color)}`
      return acc
    }, {})

    return this.handle<LabelsAdd>(
      this.fetchRequest.post(
        new URL('/label/add_multi', URL_115.WEB_API).href,
        { data },
      ).then(r => r.json()).then(normalizeTagResponse),
    )
  }

  /** 编辑标签（重命名 + 改色） */
  async editLabel(params: PostLabelEdit): Promise<Drive115Response<LabelEdit>> {
    const { id, name, color } = params
    return this.handle<LabelEdit>(
      this.fetchRequest.post(
        new URL('/label/edit', URL_115.WEB_API).href,
        {
          data: {
            id,
            name,
            ...(color !== undefined && { color: serializeColor(color) }),
          },
        },
      ).then(r => r.json()).then(normalizeTagResponse),
    )
  }

  /** 删除标签 */
  async deleteLabel(params: PostLabelDelete): Promise<Drive115Response<LabelDelete>> {
    return this.handle<LabelDelete>(
      this.fetchRequest.post(
        new URL('/label/delete', URL_115.WEB_API).href,
        { data: params },
      ).then(r => r.json()).then(normalizeTagResponse),
    )
  }

  /**
   * 给文件设置标签
   *
   * 传空数组对应的 `file_label=""` 可清空文件所有标签
   */
  async setFileLabels(fileId: string, labelIds: string[] = []): Promise<Drive115Response<FileLabels>> {
    const data: PostFileLabels = {
      fid: fileId,
      file_label: labelIds.join(','),
    }
    return this.handle<FileLabels>(
      this.fetchRequest.post(
        new URL('/files/edit', URL_115.WEB_API).href,
        { data },
      ).then(r => r.json()),
    )
  }

  /** 清除文件的所有标签 */
  async clearFileLabels(fileId: string): Promise<Drive115Response<FileLabels>> {
    return this.setFileLabels(fileId, [])
  }

  /** 标签排序（自定义排序） */
  async setLabelOrder(params: PostLabelOrder): Promise<Drive115Response<LabelOrder>> {
    const data = {
      module: 'label_search',
      ...params,
    }
    return this.handle<LabelOrder>(
      this.fetchRequest.post(
        new URL('/files/order', URL_115.WEB_API).href,
        { data },
      ).then(r => r.json()),
    )
  }

  /** 按标签筛选文件 */
  async getFilesByLabel(params: GetFilesByLabel): Promise<Drive115Response<FilesByLabel>> {
    const merged: Record<string, unknown> = {
      cid: '0',
      aid: 1,
      show_dir: 1,
      count_folders: 1,
      ...params,
    }
    return this.handle<FilesByLabel>(
      this.fetchRequest.get(
        new URL('/files/search', URL_115.WEB_API).href,
        { params: merged },
      ).then(r => r.json()),
    )
  }
}
