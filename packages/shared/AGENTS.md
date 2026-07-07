# @115master/shared

## 架构

跨应用共享基础设施层，为 `drive115`、`subtitle-source`、`monkey` 等上层包提供通用能力。

```
@115master/shared
├── request/    # HTTP 请求抽象
├── cache/      # IndexedDB 缓存系统（LRU + 配额管理）
├── logger/     # 结构化日志
├── error/      # 基础设施层错误
└── 115polyfills/  # 115 网站兼容补丁
```

## 目录结构

```
src/
├── index.ts           # 根入口（按模块导出）
├── request/
│   ├── types.ts       # IRequest 接口 + IRequestCache + RequestOptions
│   ├── fetchRequest.ts # FetchRequest 实现
│   └── index.ts
├── cache/
│   ├── core.ts        # CacheCore<T> — 通用缓存基类
│   ├── metaStore.ts   # MetaStore — 缓存元数据跟踪
│   ├── quotaManager.ts # QuotaManager — LRU 清理 + 配额监控
│   ├── types.ts       # CacheCoreOptions, CacheValue, CacheMetaItem, StorageUsage
│   ├── const.ts       # 常量（阈值、批量大小、默认名称）
│   └── index.ts
├── logger/
│   ├── types.ts       # ILogger 接口 + LogLevel, LogMethod
│   ├── logger.ts      # Logger 实现（静默模式、子日志、收集）
│   └── index.ts
├── error/
│   ├── InfraError.ts  # 基础设施错误（url + statusCode + retryable）
│   └── index.ts
└── 115polyfills/
    └── index.ts       # 恢复被 115 覆盖的 Number 构造函数属性
```

## 核心概念

### FetchRequest

`IRequest` 接口的 fetch 实现，自动处理：

- **params** — 对象自动拼接到 URL searchParams
- **data** — POST body，根据 Content-Type 自动转换（`application/json` → `JSON.stringify`，`application/x-www-form-urlencoded` → `URLSearchParams`，`multipart/form-data` → `FormData`）
- **错误** — fetch 异常统一转为 `InfraError`（`retryable: true`）

```ts
const request = new FetchRequest({ credentials: 'include' })

// GET + query params
await request.get('https://example.com/api', { params: { key: 'val' } })

// POST + form data
await request.post('https://example.com/api', { data: { key: 'val' } })
```

### CacheCore

基于 `localforage`（IndexedDB）的通用缓存基类，提供：

- **TTL / version** — 版本不匹配自动清除旧缓存
- **配额管理** — 自动估算大小，超出配额时 LRU 清理
- **QuotaExceededError 重试** — 写入失败时清理后自动重试
- **元数据跟踪** — 通过 `MetaStore` 记录每次访问时间、大小

```ts
const cache = new CacheCore<string>({ name: 'myCache', version: 2 })

await cache.set('key', 'value')
const item = await cache.get('key')  // CacheValue<string> | null
const age = await cache.getAge('key') // 从创建到现在的毫秒数
```

### QuotaManager

监控 `navigator.storage.estimate()` 使用率，超阈值（80%）时按 LRU 批量清理：

```
STORAGE_QUOTA_THRESHOLD = 0.8
CLEANUP_BATCH_SIZE = 10
```

- `shouldCleanup()` — 检查使用率是否超阈值
- `cleanup(batchSize?)` — 按最后访问时间 LRU 清理
- `autoCleanup()` — 自动检查 + 清理，供 `CacheCore.set()` 调用
- `recordAccess()` / `recordRemoval()` — 访问/删除时更新元数据

### MetaStore

独立的 IndexedDB 存储（`storeName: 'meta'`），记录每个缓存项的：

- `lastAccessed` — 最后访问时间（用于 LRU 排序）
- `createdAt` / `updatedAt` — 创建/更新时间
- `size` — 估算大小（字节）

### Logger

支持命名空间、静默模式、子日志的结构化日志：

```ts
const logger = new Logger('App', 'Module')

// 正常模式：直接打印
logger.info('用户登录成功')

// 静默模式：收集日志不打印，稍后批量输出
logger.enableSilentMode()
logger.info('这条不会打印')
logger.disableSilentMode()
logger.printLogsUsingDir()  // console.dir 所有收集的日志

// 子日志：继承命名空间 + 静默模式
const sub = logger.sub('SubModule')  // [App] [Module] [SubModule]
```

`ILogger` 接口定义 `trace | debug | info | log | warn | error | sub`，消费方依赖接口而非实现。

### InfraError

基础设施层错误，区别于业务层 `Drive115Error`：

```ts
throw new InfraError(
  '请求失败',
  url,        // 请求 URL
  500,        // statusCode（可选）
  true,       // retryable（可选，默认 false）
  cause,      // 原始错误（可选）
)
```

| 字段 | 说明 |
|------|------|
| `url` | 出错的请求地址 |
| `statusCode` | HTTP 状态码 |
| `retryable` | 是否可重试（网络异常为 true） |

### 115polyfills

115 网站会覆盖 `Number` 构造函数，导致部分功能异常。此 polyfill 从 `window.OOF_NUMBER`（115 保存的原始引用）恢复被覆盖的属性。

通过独立导出路径引用：`@115master/shared/115polyfills`

## 使用示例

```ts
import {
  CacheCore,
  MetaStore,
  QuotaManager,
  Logger,
  ILogger,
  FetchRequest,
  IRequest,
  InfraError,
} from '@115master/shared'

// 请求层
const request = new FetchRequest()

// 缓存层
const cache = new CacheCore<Blob>({
  name: 'thumbnails',
  version: 1,
  logger: new Logger('Cache'),
})
await cache.set('cover', imageBlob)

// 日志层
const logger = new Logger('Drive115', 'FileApi')
logger.info('文件列表加载完成')
```
