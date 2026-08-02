import type { Drive115CoreDeps } from './core/deps.ts'
import { AuthApiClient } from './clients/auth/index.ts'
import { ExtractApiClient } from './clients/extract/index.ts'
import { FileApiClient } from './clients/file/index.ts'
import { ImageApiClient } from './clients/image/index.ts'
import { OfflineApiClient } from './clients/offline/index.ts'
import { TagApiClient } from './clients/tag/index.ts'
import { UploadApiClient } from './clients/upload/index.ts'
import { UserApiClient } from './clients/user/index.ts'
import { VideoApiClient } from './clients/video/index.ts'

/**
 * Drive115 依赖配置
 */
export interface Drive115Deps extends Drive115CoreDeps {}

/**
 * 115 驱动入口
 */
export class Drive115 {
  /** 登录、验证码与异常验证 API */
  auth: AuthApiClient
  /** 解压缩 API */
  extract: ExtractApiClient
  /** 文件 API */
  file: FileApiClient
  /** 视频 API */
  video: VideoApiClient
  /** 离线 API */
  offline: OfflineApiClient
  /** 用户 API */
  user: UserApiClient
  /** 图片 API */
  image: ImageApiClient
  /** 上传 API */
  upload: UploadApiClient
  /** 标签 API */
  tag: TagApiClient

  constructor(deps: Drive115Deps) {
    this.auth = new AuthApiClient(deps)
    this.extract = new ExtractApiClient(deps)
    this.file = new FileApiClient(deps)
    this.video = new VideoApiClient(deps)
    this.offline = new OfflineApiClient(deps)
    this.user = new UserApiClient(deps)
    this.image = new ImageApiClient(deps)
    this.upload = new UploadApiClient(deps)
    this.tag = new TagApiClient(deps)
  }
}
