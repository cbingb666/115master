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

### WebCaptcha

网页接口以 `errNo` / `errcode` / `code` / `msg_code = 911` 表示操作前需要完成安全验证。`normalizeResponse` 将其归一化为 `CaptchaRequired`，并把响应 `data.url`（兼容顶层 `url`）保留在 `details.verifyUrl` 作为原始诊断信息。Monkey 不嵌入该页面，而是通过 `AuthApiClient` 加载 sign、提示图和 10 个候选字，再将用户按顺序选中的四个序号提交到 `/user/captcha`。

WebCaptcha 与登录流程共用四字点选挑战和 `Captcha` 票据结构，但验证成果的提交端点不同。

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

## 认证

### AuthApiClient

115 网页认证客户端，由 `Drive115.auth` 暴露。负责扫码登录、动态公钥账号登录、退出登录、中文点选验证码、登录短信码、二次验证、绑定手机跳转信息和撤销注销；认证挑战作为 `LoginOutcome` 返回，只有网络、解码等客户端失败才抛异常。

### LoginOutcome

登录响应的状态联合：`success` / `captcha` / `sms` / `two-factor` / `bind-mobile` / `cancel-close` / `locked` / `appeal` / `error`。UI 只按 `kind` 驱动流程，不直接识别 115 原始错误码。

### Captcha

中文点选验证码票据，由按序选择的候选编号 `code` 和验证码会话 `sign` 组成。账号登录使用 `login[code]` / `login[sid]`，短信发送前的人机验证使用 `code` / `sid`。
