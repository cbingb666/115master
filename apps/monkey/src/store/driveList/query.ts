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

function profileOf(request: DriveListRequest) {
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

export const driveListKeys = {
  all: ['drive-list'] as const,
  searchAll: ['drive-search'] as const,
  scope: (area: string, cid: string) => ['drive-list', area, cid] as const,
  searchScope: (area: string, cid: string) => ['drive-search', area, cid] as const,
  page: (request: DriveListRequest) => [
    ...(request.search
      ? driveListKeys.searchScope(request.area, request.cid)
      : driveListKeys.scope(request.area, request.cid)),
    'page',
    { ...profileOf(request), page: request.page },
  ] as const,
  infinite: (request: DriveListRequest) => [
    ...(request.search
      ? driveListKeys.searchScope(request.area, request.cid)
      : driveListKeys.scope(request.area, request.cid)),
    'infinite',
    profileOf(request),
  ] as const,
}

function messageOf(response: { message?: string, error?: string, error_msg?: string }) {
  return response.message ?? response.error ?? response.error_msg ?? '文件列表加载失败'
}

function normalize(
  response: Api.FileApi.Res.Files | Api.FileApi.Res.GetFilesSearch,
  request: DriveListRequest,
): DriveListPage {
  const path = 'path' in response ? response.path : []
  const fileCount = 'file_count' in response ? response.file_count : response.data.filter(item => item.fc !== 0).length
  const folderCount = 'folder_count' in response ? response.folder_count : response.data.filter(item => item.fc === 0).length

  return {
    items: response.data ?? [],
    total: response.count,
    fileCount,
    folderCount,
    path,
    page: request.page,
    size: request.size,
    order: response.order,
    asc: response.is_asc,
    fcMix: 'fc_mix' in response ? response.fc_mix : request.fcMix as Share.Base.Sorter['fc_mix'],
  }
}

function listParams(request: DriveListRequest): Api.FileApi.Req.GetFiles {
  const params: Api.FileApi.Req.GetFiles = {
    aid: 1,
    cid: request.cid,
    show_dir: 1,
    offset: (request.page - 1) * request.size,
    limit: request.size,
    format: 'json',
    natsort: 1,
  }
  if (request.order || request.asc || request.fcMix) {
    params.o = request.order as Share.Base.Sorter['o']
    params.asc = request.asc as Share.Base.Sorter['asc']
    params.fc_mix = request.fcMix as Share.Base.Sorter['fc_mix']
  }
  if (request.area === 'star')
    params.star = 1
  if (request.suffix)
    params.suffix = request.suffix
  if (request.type)
    params.type = Number(request.type)
  if (request.nf)
    params.nf = request.nf
  return params
}

function searchParams(request: DriveListRequest): Api.FileApi.Req.GetFilesSearch {
  const params: Api.FileApi.Req.GetFilesSearch = {
    aid: 1,
    cid: request.cid,
    show_dir: 1,
    offset: (request.page - 1) * request.size,
    limit: request.size,
    format: 'json',
    search_value: request.keyword,
  }
  if (request.suffix)
    params.suffix = request.suffix
  if (request.type)
    params.type = Number(request.type)
  if (request.fc)
    params.fc = Number(request.fc) as Api.FileApi.Req.GetFilesSearch['fc']
  return params
}

export async function fetchDriveListPage(request: DriveListRequest, signal?: AbortSignal): Promise<DriveListPage> {
  if (request.search) {
    const response = await drive115.file.searchFiles(searchParams(request), signal)
    if (!response.state)
      throw new Core.Drive115Error(messageOf(response), Core.Drive115ErrorCode.Unknown)
    return normalize(response, request)
  }

  const response = await drive115.file.getFilesWithFallback(listParams(request), signal)
  if (!response.state)
    throw new Core.Drive115Error(messageOf(response), Core.Drive115ErrorCode.Unknown)
  return normalize(response, request)
}

export function mergeDriveListPages(pages: DriveListPage[]): DriveListPage | undefined {
  const first = pages[0]
  const last = pages[pages.length - 1]
  if (!first || !last)
    return undefined

  const items = new Map<string, Share.Entity.FilesItem>()
  let path = first.path
  pages.forEach(page => page.items.forEach(item => items.set(getFilesItemId(item), item)))
  pages.forEach((page) => {
    if (page.path.length > 0)
      path = page.path
  })
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
