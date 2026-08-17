import type { Api, Share } from '@115master/drive115'
import { Core } from '@115master/drive115'
import { drive115 } from '@/utils/drive115Instance'
import { getFilesItemId } from '@/utils/filesItem'

export interface DriveListProfile {
  size: number
  order: string
  asc: number
  fcMix: number
  suffix: string
  type: string
  fc: string
  nf: string
  keyword: string
}

export interface DriveListRequest extends DriveListProfile {
  area: string
  cid: string
  page: number
  search: boolean
}

export interface DriveListPage {
  items: Share.Entity.FilesItem[]
  total: number
  fileCount: number
  folderCount: number
  path: Share.Entity.PathItem[]
  page: number
  size: number
  order: Share.Base.Sorter['o']
  asc: Share.Base.Sorter['asc']
  fcMix: Share.Base.Sorter['fc_mix']
}

function profile(request: DriveListRequest) {
  return {
    size: request.size,
    order: request.order,
    asc: request.asc,
    fcMix: request.fcMix,
    suffix: request.suffix,
    type: request.type,
    fc: request.fc,
    nf: request.nf,
    keyword: request.keyword,
  }
}

function scope(request: DriveListRequest) {
  return [request.search ? 'drive-search' : 'drive-list', request.area, request.cid] as const
}

export const driveListKeys = {
  page: (request: DriveListRequest) => [
    ...scope(request),
    'page',
    { ...profile(request), page: request.page },
  ] as const,
  infinite: (request: DriveListRequest) => [
    ...scope(request),
    'infinite',
    profile(request),
  ] as const,
}

function messageOf(response: { message?: string, error?: string, error_msg?: string }) {
  return response.message ?? response.error ?? response.error_msg ?? '文件列表加载失败'
}

function normalize(
  response: Api.FileApi.Res.Files | Api.FileApi.Res.GetFilesSearch,
  request: DriveListRequest,
): DriveListPage {
  const items = response.data ?? []
  const path = 'path' in response ? response.path : []

  return {
    items,
    total: response.count,
    fileCount: 'file_count' in response ? response.file_count : items.filter(item => item.fc !== 0).length,
    folderCount: 'folder_count' in response ? response.folder_count : items.filter(item => item.fc === 0).length,
    path,
    page: request.page,
    size: request.size,
    order: response.order,
    asc: response.is_asc,
    fcMix: 'fc_mix' in response ? response.fc_mix : request.fcMix as Share.Base.Sorter['fc_mix'],
  }
}

function pageParams(request: DriveListRequest) {
  return {
    aid: 1,
    cid: request.cid,
    show_dir: 1,
    offset: (request.page - 1) * request.size,
    limit: request.size,
    format: 'json',
  } as const
}

function listParams(request: DriveListRequest): Api.FileApi.Req.GetFiles {
  return {
    ...pageParams(request),
    natsort: 1,
    ...((request.order || request.asc || request.fcMix) && {
      o: request.order as Share.Base.Sorter['o'],
      asc: request.asc as Share.Base.Sorter['asc'],
      fc_mix: request.fcMix as Share.Base.Sorter['fc_mix'],
    }),
    ...(request.area === 'star' && { star: 1 as const }),
    ...(request.suffix && { suffix: request.suffix }),
    ...(request.type && { type: Number(request.type) }),
    ...(request.nf && { nf: request.nf }),
  }
}

function searchParams(request: DriveListRequest): Api.FileApi.Req.GetFilesSearch {
  return {
    ...pageParams(request),
    search_value: request.keyword,
    ...(request.suffix && { suffix: request.suffix }),
    ...(request.type && { type: Number(request.type) }),
    ...(request.fc && { fc: Number(request.fc) as Api.FileApi.Req.GetFilesSearch['fc'] }),
  }
}

export async function fetchDriveListPage(request: DriveListRequest, signal?: AbortSignal): Promise<DriveListPage> {
  const response = request.search
    ? await drive115.file.searchFiles(searchParams(request), signal)
    : await drive115.file.getFilesWithFallback(listParams(request), signal)
  if (!response.state)
    throw new Core.Drive115Error(messageOf(response), Core.Drive115ErrorCode.Unknown)
  return normalize(response, request)
}

export function mergeDriveListPages(pages: DriveListPage[]): DriveListPage | undefined {
  const first = pages[0]
  const last = pages[pages.length - 1]
  if (!first || !last)
    return undefined

  const items = new Map(pages.flatMap(page => (
    page.items.map(item => [getFilesItemId(item), item] as const)
  )))
  const path = pages.reduce((current, page) => page.path.length > 0 ? page.path : current, first.path)
  return {
    ...last,
    items: [...items.values()],
    path,
    page: Math.max(...pages.map(page => page.page)),
  }
}

export function toListData(page: DriveListPage): Api.FileApi.Res.Files {
  return {
    state: true,
    count: page.total,
    file_count: page.fileCount,
    folder_count: page.folderCount,
    is_asc: page.asc,
    order: page.order,
    fc_mix: page.fcMix,
    offset: (page.page - 1) * page.size,
    cur: page.page,
    data: page.items,
    path: page.path,
  }
}
