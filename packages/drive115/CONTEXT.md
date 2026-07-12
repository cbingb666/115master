# @115master/drive115 · 领域词汇表

本包对外暴露的领域概念。架构评审 / 重构提案 / 测试命名应使用这些术语，勿漂移到同义词。

## 失败与错误

### Drive115Error

唯一对外失败类型。所有 client 方法失败时抛出此类型。业务层错误（normalizeResponse / client 手动抛）与网络层错误（经 `fromInfra` 转换）统一以此类型流出，调用方无需 `instanceof` 分派。

字段：`code` / `retryable` / `url?` / `statusCode?` / `cause?` / `details?`，派生 `action`（getter，基于 code + retryable）。

### Drive115ErrorCode

错误码枚举。正数为 115 后端 errNo（`SessionExpired=990001`、`CaptchaRequired=911`、`DecodeError=2`、`NotFoundM3u8File=1`）；`NetworkError=-1` 为客户端构造（网络层失败），取负数避免与后端码冲突。

### NetworkError

网络层失败对应的 code（来自 `InfraError` 经 `fromInfra` 转换）。恒可重试（`retryable=true`）—— `FetchRequest` 仅在 fetch 本身抛异常（断网 / DNS / CORS / 超时）时抛 InfraError；HTTP 4xx/5xx 不抛，走响应级 `state`。

### action

UI 行动提示，四态：

- `relogin` — 登录已过期，触发重新登录（SessionExpired）
- `verify` — 需人机验证（CaptchaRequired）
- `retry` — 可重试（DecodeError / NotFoundM3u8File / NetworkError，或 retryable 的未知错误）
- `none` — 无行动

由 `decideAction(code, retryable)` 派生：code 优先映射，retryable 兜底。

### retryable

错误是否值得重试。网络层错误恒 `true`；业务层错误默认 `false`（其 action 由 code 决定时不依赖它）。

### ErrorResult

`Drive115Error` 的纯数据投影（去 Error 包袱）。供 `onError` 回调与日志消费，由 `toResult(Drive115Error)` 产出。`onError` 收 `ErrorResult`，而非原始 `Error`。

## 错误管道（handle 边界）

`BaseApiClient.handle()` 是错误归一化的唯一边界：

- 成功 → `Drive115Response<T>`
- 失败 → `toDrive115Error(e)` 归一化为 `Drive115Error` → `toResult` 投影经 `onError` 通知 → 抛出

转换函数：`toDrive115Error`（边界归一化）/ `fromInfra`（InfraError→NetworkError）/ `toResult`（投影）/ `decideAction`（action 决策）。

历史：曾存在 `handleError`（外部调用方各自分类，3 处重复）与 `Drive115Error.NotFoundM3u8File` 嵌套子类，已在错误管道贯通后移除——职责被 `decideAction` / `fromInfra` / `toResult` 吸收，调用方改读 `e.code` / `e.action`。详见 `docs/adr/ADR-0001.md`。
