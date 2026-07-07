# @115master/drive115

## 架构

门面模式：`Drive115` 类聚合 5 个领域 API Client，统一通过依赖注入配置。

```
Drive115 (facade)
├── FileApiClient    # 文件 CRUD、搜索、排序、星标、历史
├── VideoApiClient   # 视频播放地址、字幕映射
├── OfflineApiClient # 离线下载（磁力/BT）
├── UserApiClient    # 用户信息
└── ImageApiClient   # 图片操作
```

所有 Client 继承 `BaseApiClient`，共享 `handle()` 响应归一化与 `proApiEncodeData()` Pro API 编码。

## 目录结构

```
src/
├── drive115.ts        # Drive115 门面 + Drive115Deps 类型
├── index.ts           # 根入口（按命名空间导出）
├── clients/           # 领域 API Client
│   ├── base.ts        # BaseApiClient 基类
│   ├── index.ts       # Client 汇总导出
│   ├── file/          # 文件领域
│   │   ├── client.ts  # FileApiClient 实现
│   │   ├── req.ts     # 请求参数类型
│   │   ├── res.ts     # 响应数据类型
│   │   ├── schema.ts  # Zod 响应校验
│   │   └── index.ts   # 领域入口
│   ├── video/         # 同上结构
│   ├── offline/
│   ├── user/
│   └── image/
├── core/              # 核心运行时
│   ├── crypto.ts      # Crypto115 — M115 编解码
│   ├── rsa.ts         # RSA 加解密
│   ├── deps.ts        # Drive115CoreDeps 依赖接口
│   ├── error.ts       # Drive115Error + handleError
│   ├── response.ts    # normalizeResponse + Drive115Response
│   └── index.ts       # Core 汇总导出
└── share/             # 共享类型与常量
    ├── base.ts        # 通用参数接口（BaseParams, PaginationParams, Sorter）
    ├── constant.ts    # 115 域名常量（HOST_115, URL_115）
    ├── entity.ts      # 领域实体（FileItem, FolderItem, PathItem 等）
    └── index.ts       # Share 汇总导出
```

## 核心概念

### 依赖注入

`Drive115` 通过 `Drive115Deps` 接收所有外部依赖：

```ts
const api = new Drive115({
  fetchRequest,    // IRequest — 普通 HTTP 请求
  proApiRequest,   // IRequest — Pro API 请求（走浏览器环境）
  crypto115,       // Crypto115 实例
  logger,          // ILogger（可选）
  onError,         // 统一错误拦截回调（可选）
})
```

### BaseApiClient.handle()

所有 API 方法通过 `this.handle(promise, schema?)` 统一处理响应：

1. `await` 原始响应
2. `normalizeResponse()` 收敛后端不一致的响应形状 → `Drive115Response<T>`
3. 通用错误码检查（SessionExpired、CaptchaRequired）
4. 可选 Zod schema 校验
5. 异常通过 `this.deps.onError` 拦截后重新抛出

```ts
async getFiles(params: Req.GetFiles): Promise<Drive115Response<Res.Files>> {
  return this.handle<Res.Files>(
    this.fetchRequest.get(url, { params }).then(r => r.json()),
    Schema.FilesResponseSchema,  // 可选
  )
}
```

### normalizeResponse

将后端字段 `errNo` / `code` / `error` / `error_msg` 收敛为统一的 `Drive115Response<T>`：

```ts
type Drive115Response<T> = T & {
  state: boolean   // 请求是否成功
  code: number     // 统一错误码（0 表示成功）
  message: string  // 统一错误消息
}
```

### 错误处理

三层错误架构：

1. **`Drive115Error`** — 领域错误，含 `code`（`Drive115ErrorCode`）和 `cause`
2. **`normalizeResponse`** — 自动抛出 `SessionExpired` / `CaptchaRequired`
3. **`handleError`** — 将错误转为 `ErrorResult`，包含 UI 行动提示：

```
action: 'relogin' | 'verify' | 'retry' | 'none'
```

调用方用 `handleError` 决定 UI 行为，无需识别具体错误码。

### Pro API 编码

需要走 Pro API 的请求，使用 `proApiEncodeData()`：

```ts
const { tm, encoded, encodedData } = this.proApiEncodeData(data)
// tm: 时间戳，encoded: M115EncodeResult，encodedData: URL 编码后的 data 参数
```

底层：MD5 时间戳 → symEncode（XOR + reverse）→ asymEncode（RSA）→ base64。

### Client 文件约定

每个领域 Client 目录结构一致：

| 文件 | 职责 |
|------|------|
| `client.ts` | Client 类实现，继承 `BaseApiClient` |
| `req.ts` | 请求参数类型（`Req.*`） |
| `res.ts` | 响应数据类型（`Res.*`） |
| `schema.ts` | Zod 校验 schema（`Schema.*`） |
| `index.ts` | 领域汇总导出（`FileApiClient` + `Req` / `Res` / `Schema` 命名空间） |

### 共享参数

`share/base.ts` 提供可复用的请求参数接口：

- `BaseParams` — 通用参数（`format`, `callback` 等）
- `PaginationParams` — 分页参数（`offset`, `limit`）
- `Sorter` — 排序参数（`o`, `asc`）

## 使用示例

```ts
import { Drive115, Api, Core, Share, Crypto115 } from '@115master/drive115'

const api = new Drive115({
  fetchRequest,
  proApiRequest,
  crypto115: new Crypto115(),
  onError: (e) => console.error(e),
})

// 获取文件列表
const files = await api.file.getFiles({ aid: 1, cid: '0' })

// 获取视频下载地址（Pro API → Web API 自动回退）
const download = await api.video.getFileDownloadUrl('xxx')

// 错误处理
import { handleError } from '@115master/drive115'
const result = handleError(error)
if (result.action === 'relogin')
  showLoginDialog()
