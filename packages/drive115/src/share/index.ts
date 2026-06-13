// 业务域类型命名空间（与 clients/ 对齐）
export type * as FileApi from '../clients/file/index.ts'
export type * as ImageApi from '../clients/image/index.ts'
export type * as OfflineApi from '../clients/offline/index.ts'

export type * as UserApi from '../clients/user/index.ts'
export type * as VideoApi from '../clients/video/index.ts'
export * from './constants/index.ts'
export type * as Entity from './entity.ts'
export type {
  ApiResponseBase,
  BaseParams,
  PaginationParams,
  PlayingVideoInfo,
  Sorter,
} from './shared.ts'
